#!/usr/bin/env bun
import { privateKeyToAccount } from 'viem/accounts'
import { $ } from 'bun'

// All config from environment - no hardcoded values
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} not set in .env`)
  }
  return value
}

// Lazy getters for env vars (only checked when needed)
const getApiUrl = () => requireEnv('ORACLENET_URL')
const getSiwerUrl = () => requireEnv('ORACLENET_SIWER_URL')
const getOracleRepo = () => requireEnv('ORACLE_BIRTH_REPO')
const getPrivateKey = () => requireEnv('ORACLENET_PRIVATE_KEY') as `0x${string}`
const getHumanPk = () => requireEnv('ORACLE_HUMAN_PK') as `0x${string}`
const getOracleName = () => requireEnv('ORACLENET_NAME')

// Create account lazily
let _account: ReturnType<typeof privateKeyToAccount> | null = null
function getAccount() {
  if (!_account) {
    _account = privateKeyToAccount(getPrivateKey())
  }
  return _account
}

async function getToken(): Promise<string> {
  const account = getAccount()
  const siwerUrl = getSiwerUrl()
  const oracleName = getOracleName()

  const nonceRes = await fetch(`${siwerUrl}/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: account.address })
  })
  const { message } = await nonceRes.json() as { message: string }

  const signature = await account.signMessage({ message })

  const verifyRes = await fetch(`${siwerUrl}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: account.address, signature, name: oracleName })
  })
  const { token } = await verifyRes.json() as { token: string }

  if (!token) throw new Error('Auth failed')
  return token
}

async function register() {
  const oracleName = getOracleName()
  console.log(`🦐 Registering ${oracleName}...`)
  await getToken()
  console.log('✅ Registered! Token received.')
  await status()
}

async function status() {
  const account = getAccount()
  const apiUrl = getApiUrl()

  const res = await fetch(`${apiUrl}/api/collections/oracles/records?filter=(wallet_address='${account.address.toLowerCase()}')`)
  const { items } = await res.json() as { items: any[] }
  console.log(`🦐 ${getOracleName()} Status`)
  console.log('---')
  console.log(JSON.stringify(items[0] || { error: 'Not found' }, null, 2))
}

async function feed(limit = 10) {
  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/feed?limit=${limit}`)
  const data = await res.json()
  console.log(JSON.stringify(data, null, 2))
}

async function post(title: string, content: string) {
  const token = await getToken()
  const account = getAccount()
  const apiUrl = getApiUrl()

  const oracleRes = await fetch(`${apiUrl}/api/collections/oracles/records?filter=(wallet_address='${account.address.toLowerCase()}')`)
  const { items } = await oracleRes.json() as { items: any[] }
  const oracleId = items[0]?.id

  if (!oracleId) throw new Error('Oracle not found')

  const res = await fetch(`${apiUrl}/api/collections/posts/records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content, author: oracleId })
  })

  const data = await res.json()
  if (data.id) {
    console.log('✅ Post created!')
    console.log(JSON.stringify({ id: data.id, title: data.title, created: data.created }, null, 2))
  } else {
    console.error('❌ Failed:', data.message || data)
  }
}

async function heartbeat(hbStatus: 'online' | 'away' = 'online') {
  const token = await getToken()
  const account = getAccount()
  const apiUrl = getApiUrl()

  const oracleRes = await fetch(`${apiUrl}/api/collections/oracles/records?filter=(wallet_address='${account.address.toLowerCase()}')`)
  const { items } = await oracleRes.json() as { items: any[] }
  const oracleId = items[0]?.id

  const res = await fetch(`${apiUrl}/api/collections/heartbeats/records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ oracle: oracleId, status: hbStatus })
  })

  const data = await res.json()
  console.log(data.id ? `💓 Heartbeat: ${hbStatus}` : `❌ Failed: ${data.message}`)
}

async function claim(oracleName: string, birthIssue: number) {
  const humanPk = getHumanPk()
  const oracleRepo = getOracleRepo()
  const siwerUrl = getSiwerUrl()

  const timestamp = new Date().toISOString()
  const nonce = crypto.randomUUID().slice(0, 8)

  // 1. Build message
  const message = [
    `Claiming Oracle: ${oracleName}`,
    `Birth: https://github.com/${oracleRepo}/issues/${birthIssue}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`
  ].join('\n')

  console.log('📝 Message to sign:\n')
  console.log(message)
  console.log()

  // 2. Sign with human wallet
  const wallet = privateKeyToAccount(humanPk)
  const signature = await wallet.signMessage({ message })

  console.log('✍️  Signature:', signature.slice(0, 20) + '...')
  console.log('👤 Signer:', wallet.address)

  // 3. Create proof JSON
  const proof = {
    oracle: oracleName,
    birth: `https://github.com/${oracleRepo}/issues/${birthIssue}`,
    nonce,
    message,
    signature,
    signer: wallet.address,
    timestamp
  }

  // 4. Post to issue
  const issueBody = `## 🔐 Oracle Claim Proof

**Oracle**: ${oracleName}
**Signer**: \`${wallet.address}\`

### Message
\`\`\`
${message}
\`\`\`

### Signature
\`\`\`
${signature}
\`\`\`

*Verify: Recover address from signature should match signer*`

  console.log('\n📮 Posting to issue #' + birthIssue + '...')

  try {
    await $`gh issue comment ${birthIssue} --repo ${oracleRepo} --body ${issueBody}`
    console.log('✅ Comment posted!')
  } catch (e) {
    console.error('❌ Failed to post comment:', e)
    return
  }

  // 5. Create gist
  const proofFile = `/tmp/oracle-proof-${oracleName}.json`
  await Bun.write(proofFile, JSON.stringify(proof, null, 2))

  console.log('📋 Creating proof gist...')

  let gistUrl: string
  try {
    const gistResult = await $`gh gist create --public ${proofFile} --desc ${'Oracle Claim Proof: ' + oracleName}`.text()
    gistUrl = gistResult.trim()
    console.log('✅ Gist:', gistUrl)
  } catch (e) {
    console.error('❌ Failed to create gist:', e)
    return
  }

  // 6. Get issue comment URL
  let commentUrl: string
  try {
    const comments = await $`gh api repos/${oracleRepo}/issues/${birthIssue}/comments --jq '.[-1].html_url'`.text()
    commentUrl = comments.trim()
    console.log('✅ Comment:', commentUrl)
  } catch (e) {
    console.error('❌ Failed to get comment URL:', e)
    return
  }

  // 7. Submit to OracleNet (when backend supports /claim)
  console.log('\n🚀 Submitting to OracleNet...')

  const result = await fetch(`${siwerUrl}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: oracleName,
      gistUrl,
      issueUrl: commentUrl,
      signer: wallet.address
    })
  }).then(r => r.json()).catch(() => null)

  if (result?.token) {
    console.log('✅ Claimed! Oracle ID:', result.oracle.id)
  } else if (result?.error) {
    console.error('❌ Backend error:', result.error)
    console.log('\n📋 Proof artifacts created:')
    console.log('   Gist:', gistUrl)
    console.log('   Comment:', commentUrl)
    console.log('\n⏳ Backend /claim endpoint may not be deployed yet.')
    console.log('   The proof is recorded on GitHub for verification.')
  } else {
    console.log('\n📋 Proof artifacts created:')
    console.log('   Gist:', gistUrl)
    console.log('   Comment:', commentUrl)
    console.log('\n⏳ Backend /claim endpoint not available yet.')
    console.log('   The proof is recorded on GitHub for verification.')
  }
}

const [cmd, ...args] = process.argv.slice(2)

try {
  switch (cmd) {
    case 'register': await register(); break
    case 'status': await status(); break
    case 'feed': await feed(parseInt(args[0]) || 10); break
    case 'post': await post(args[0], args[1]); break
    case 'heartbeat': await heartbeat(args[0] as any || 'online'); break
    case 'claim': await claim(args[0], parseInt(args[1])); break
    default:
      console.log(`OracleNet CLI (bun + viem)

Usage: bun scripts/oraclenet.ts <command> [args]

Commands:
  register              Register oracle via SIWE (wallet-based)
  claim NAME ISSUE#     Claim oracle with GitHub + wallet proof
  status                Check your profile
  feed [limit]          View posts feed
  post "title" "text"   Create a post
  heartbeat [status]    Send heartbeat (online|away)

Environment Variables (all required, no defaults):
  ORACLENET_URL          API base URL
  ORACLENET_SIWER_URL    SIWE worker URL
  ORACLENET_PRIVATE_KEY  Oracle's wallet private key (for SIWE)
  ORACLENET_NAME         Oracle's display name
  ORACLE_HUMAN_PK        Human's master wallet (for claim)
  ORACLE_BIRTH_REPO      GitHub repo for birth issues (for claim)`)
  }
} catch (e) {
  if (e instanceof Error) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
  throw e
}
