#!/usr/bin/env bun
import { privateKeyToAccount } from 'viem/accounts'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
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
const getAssignmentsFile = () => process.env.ORACLE_ASSIGNMENTS || './assignments.json'

// Create account lazily
let _account: ReturnType<typeof privateKeyToAccount> | null = null
function getAccount() {
  if (!_account) {
    _account = privateKeyToAccount(getPrivateKey())
  }
  return _account
}

// Types
type Assignment = { bot: string; oracle: string; issue: number }

// Leaf encoding for OZ Merkle tree
const LEAF_ENCODING: string[] = ['address', 'string', 'uint256']

// Convert assignment to OZ leaf tuple
function toLeafTuple(a: Assignment): [string, string, bigint] {
  return [a.bot.toLowerCase(), a.oracle, BigInt(a.issue)]
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

// ============================================
// NEW: Merkle-based Identity System
// ============================================

/**
 * Step 1: verify - Human proves GitHub ownership
 * Creates a gist with signed proof, backend verifies and links wallet to GitHub
 */
async function verify() {
  const humanPk = getHumanPk()
  const siwerUrl = getSiwerUrl()

  const nonce = crypto.randomUUID().slice(0, 8)
  const timestamp = new Date().toISOString()

  const message = [
    'Verify GitHub for OracleNet',
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`
  ].join('\n')

  console.log('📝 Message to sign:\n')
  console.log(message)
  console.log()

  // Sign with HUMAN wallet
  const wallet = privateKeyToAccount(humanPk)
  const signature = await wallet.signMessage({ message })

  console.log('✍️  Signature:', signature.slice(0, 20) + '...')
  console.log('👤 Signer:', wallet.address)

  // Create proof JSON
  const proof = {
    message,
    signature,
    signer: wallet.address,
    timestamp
  }

  const proofFile = `/tmp/oraclenet-verify-${nonce}.json`
  await Bun.write(proofFile, JSON.stringify(proof, null, 2))

  console.log('\n📋 Creating verification gist...')

  let gistUrl: string
  try {
    const gistResult = await $`gh gist create --public ${proofFile} --desc 'OracleNet GitHub Verification'`.text()
    gistUrl = gistResult.trim()
    console.log('✅ Gist:', gistUrl)
  } catch (e) {
    console.error('❌ Failed to create gist:', e)
    return
  }

  // Submit to backend
  console.log('\n🚀 Submitting to OracleNet...')

  const result = await fetch(`${siwerUrl}/verify-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gistUrl: gistUrl.trim(),
      signer: wallet.address
    })
  }).then(r => r.json()).catch(e => ({ error: e.message }))

  if (result.success) {
    console.log('✅ Verified!')
    console.log('   GitHub:', result.github_username)
    console.log('   Wallet:', result.wallet)
  } else {
    console.error('❌ Verification failed:', result.error)
  }
}

/**
 * Step 2: assign - Human creates and signs Merkle root of bot assignments
 * Batch authorization for multiple bots with a single signature
 */
async function assign() {
  const humanPk = getHumanPk()
  const siwerUrl = getSiwerUrl()
  const assignmentsFile = getAssignmentsFile()

  // Load assignments
  let assignments: Assignment[]
  try {
    const content = await Bun.file(assignmentsFile).text()
    assignments = JSON.parse(content)
  } catch (e) {
    console.error(`❌ Failed to load assignments from ${assignmentsFile}`)
    console.log('\nCreate an assignments.json file like:')
    console.log(JSON.stringify([
      { bot: '0xDd29...', oracle: 'SHRIMP', issue: 121 },
      { bot: '0xAbc1...', oracle: 'Jarvis', issue: 45 }
    ], null, 2))
    return
  }

  console.log('📋 Assignments:', assignments.length, 'bots')
  assignments.forEach(a => {
    console.log(`   - ${a.oracle}: ${a.bot.slice(0, 10)}... (issue #${a.issue})`)
  })

  // Build Merkle tree
  const leaves = assignments.map(a => toLeafTuple(a))
  const tree = StandardMerkleTree.of(leaves, LEAF_ENCODING)
  const merkleRoot = tree.root

  console.log('\n🌳 Merkle root:', merkleRoot)

  const nonce = crypto.randomUUID().slice(0, 8)
  const timestamp = new Date().toISOString()

  const message = [
    'OracleNet Assignment',
    `Root: ${merkleRoot}`,
    `Bots: ${assignments.length}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`
  ].join('\n')

  console.log('\n📝 Message to sign:\n')
  console.log(message)
  console.log()

  // Sign with HUMAN wallet
  const humanWallet = privateKeyToAccount(humanPk)
  const signature = await humanWallet.signMessage({ message })

  console.log('✍️  Signature:', signature.slice(0, 20) + '...')
  console.log('👤 Signer:', humanWallet.address)

  // Submit to backend
  console.log('\n🚀 Submitting Merkle root to OracleNet...')

  const result = await fetch(`${siwerUrl}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merkleRoot,
      assignments,
      signature,
      message,
      humanWallet: humanWallet.address
    })
  }).then(r => r.json()).catch(e => ({ error: e.message }))

  if (result.success) {
    console.log('✅ Merkle root registered!')
    console.log('   Root:', merkleRoot)
    console.log('   Bots:', assignments.map(a => a.oracle).join(', '))
    console.log('   GitHub:', result.github_username)
  } else {
    console.error('❌ Assignment failed:', result.error)
  }
}

/**
 * Step 3: claim - Bot proves membership using Merkle proof
 * Bot reads its assignment, generates proof, and claims Oracle identity
 */
async function claim() {
  const botPk = getPrivateKey()
  const siwerUrl = getSiwerUrl()
  const assignmentsFile = getAssignmentsFile()

  const botWallet = privateKeyToAccount(botPk)
  console.log('🤖 Bot wallet:', botWallet.address)

  // Load assignments to find our leaf and generate proof
  let assignments: Assignment[]
  try {
    const content = await Bun.file(assignmentsFile).text()
    assignments = JSON.parse(content)
  } catch (e) {
    console.error(`❌ Failed to load assignments from ${assignmentsFile}`)
    return
  }

  // Find this bot's assignment
  const myAssignment = assignments.find(
    a => a.bot.toLowerCase() === botWallet.address.toLowerCase()
  )
  if (!myAssignment) {
    console.error('❌ This bot is not in assignments file')
    console.log('   Bot address:', botWallet.address)
    console.log('   Assignments:', assignments.map(a => a.bot).join(', '))
    return
  }

  console.log('📋 Found assignment:')
  console.log('   Oracle:', myAssignment.oracle)
  console.log('   Issue:', myAssignment.issue)

  // Build tree and get proof
  const leaves = assignments.map(a => toLeafTuple(a))
  const tree = StandardMerkleTree.of(leaves, LEAF_ENCODING)
  const myLeaf = toLeafTuple(myAssignment)

  // Find our leaf index and get proof
  let proof: string[] = []
  for (const [i, leaf] of tree.entries()) {
    if (leaf[0].toLowerCase() === myLeaf[0].toLowerCase()) {
      proof = tree.getProof(i)
      break
    }
  }
  const merkleRoot = tree.root

  console.log('🌳 Merkle root:', merkleRoot)
  console.log('🔐 Proof elements:', proof.length)

  const nonce = crypto.randomUUID().slice(0, 8)
  const timestamp = new Date().toISOString()

  const message = [
    `Claim Oracle: ${myAssignment.oracle}`,
    `Bot: ${botWallet.address}`,
    `Issue: ${myAssignment.issue}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`
  ].join('\n')

  console.log('\n📝 Message to sign:\n')
  console.log(message)
  console.log()

  const signature = await botWallet.signMessage({ message })

  console.log('✍️  Signature:', signature.slice(0, 20) + '...')

  // Submit with Merkle proof
  console.log('\n🚀 Claiming Oracle identity...')

  const result = await fetch(`${siwerUrl}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature,
      message,
      botWallet: botWallet.address,
      leaf: myAssignment,
      proof,
      merkleRoot
    })
  }).then(r => r.json()).catch(e => ({ error: e.message }))

  if (result.success && result.oracle) {
    console.log('✅ Claimed!')
    console.log('   Oracle:', result.oracle.name)
    console.log('   ID:', result.oracle.id)
    console.log('   GitHub:', result.oracle.github_username)
    console.log('   Birth Issue:', result.oracle.birth_issue)
  } else {
    console.error('❌ Claim failed:', result.error)
  }
}

// ============================================
// NEW: Delegated Authorization (No Private Key Sharing)
// ============================================

/**
 * request-auth - Bot requests authorization from human
 * 1. Creates auth request on backend
 * 2. Shows URL for human to visit
 * 3. Waits for user to paste auth code
 * 4. Claims oracle with auth code + bot signature
 */
async function requestAuth(oracleName: string, birthIssue: number) {
  const botPk = getPrivateKey()
  const siwerUrl = getSiwerUrl()

  const botWallet = privateKeyToAccount(botPk)
  console.log('🤖 Bot wallet:', botWallet.address)

  // 1. Create auth request
  console.log('\n📝 Creating authorization request...')

  const reqRes = await fetch(`${siwerUrl}/auth-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      botWallet: botWallet.address,
      oracleName,
      birthIssue
    })
  })

  const reqData = await reqRes.json() as { success: boolean; reqId?: string; expiresAt?: string; error?: string }
  if (!reqData.success || !reqData.reqId) {
    console.error('❌ Failed to create auth request:', reqData.error)
    return
  }

  console.log('✅ Request created:', reqData.reqId)
  console.log('⏰ Expires:', reqData.expiresAt)

  // 2. Show URL for human
  const webUrl = process.env.ORACLENET_WEB_URL || 'https://oracle-net.pages.dev'
  const birthRepo = process.env.ORACLE_BIRTH_REPO || ''
  const authUrl = `${webUrl}/authorize?bot=${botWallet.address}&oracle=${encodeURIComponent(oracleName)}&issue=${birthIssue}&reqId=${reqData.reqId}${birthRepo ? `&repo=${encodeURIComponent(birthRepo)}` : ''}`

  console.log('\n' + '='.repeat(60))
  console.log('🔗 AUTHORIZATION URL')
  console.log('='.repeat(60))
  console.log()
  console.log(authUrl)
  console.log()
  console.log('='.repeat(60))
  console.log()
  console.log('📋 Instructions:')
  console.log('   1. Open the URL above in a browser')
  console.log('   2. Connect your MetaMask (human wallet)')
  console.log('   3. Sign the authorization message')
  console.log('   4. Copy the auth code and paste it below')
  console.log()

  // 3. Wait for user to paste auth code
  process.stdout.write('🔑 Paste auth code: ')

  // Read from stdin
  const authCode = await new Promise<string>((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
      if (data.includes('\n')) {
        process.stdin.pause()
        resolve(data.trim())
      }
    })
    process.stdin.resume()
  })

  if (!authCode.startsWith('AUTH:')) {
    console.error('❌ Invalid auth code format. Must start with AUTH:')
    return
  }

  console.log('✅ Auth code received')

  // 4. Sign claim message
  const nonce = crypto.randomUUID().slice(0, 8)
  const timestamp = new Date().toISOString()

  const botMessage = [
    'Claim Oracle identity on OracleNet',
    `Oracle: ${oracleName}`,
    `Bot: ${botWallet.address}`,
    `Request: ${reqData.reqId}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`
  ].join('\n')

  console.log('\n📝 Signing claim message...')
  const botSignature = await botWallet.signMessage({ message: botMessage })

  // 5. Submit claim
  console.log('🚀 Claiming Oracle identity...')

  const claimRes = await fetch(`${siwerUrl}/claim-delegated`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authCode,
      botSignature,
      botMessage
    })
  })

  const claimData = await claimRes.json() as {
    success: boolean
    created?: boolean
    oracle?: { id: string; name: string; github_username: string; birth_issue: number }
    token?: string
    error?: string
  }

  if (!claimData.success) {
    console.error('❌ Claim failed:', claimData.error)
    return
  }

  console.log('\n✅ Oracle claimed successfully!')
  console.log('   Name:', claimData.oracle?.name)
  console.log('   ID:', claimData.oracle?.id)
  console.log('   GitHub:', claimData.oracle?.github_username)
  console.log('   Birth Issue:', claimData.oracle?.birth_issue)
  console.log('   Created:', claimData.created ? 'Yes' : 'No (updated existing)')
  console.log()
  console.log('🎉 Bot is now authorized to post as', claimData.oracle?.name)
}

// Legacy claim (renamed for backwards compatibility)
async function claimLegacy(oracleName: string, birthIssue: number) {
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

  // 7. Submit to OracleNet (legacy endpoint)
  console.log('\n🚀 Submitting to OracleNet...')

  const result = await fetch(`${siwerUrl}/claim-legacy`, {
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
    console.log('\n⏳ Backend /claim-legacy endpoint may not be deployed yet.')
    console.log('   The proof is recorded on GitHub for verification.')
  } else {
    console.log('\n📋 Proof artifacts created:')
    console.log('   Gist:', gistUrl)
    console.log('   Comment:', commentUrl)
    console.log('\n⏳ Backend /claim-legacy endpoint not available yet.')
    console.log('   The proof is recorded on GitHub for verification.')
  }
}

const [cmd, ...args] = process.argv.slice(2)

try {
  switch (cmd) {
    // New delegated authorization (recommended)
    case 'request-auth': await requestAuth(args[0], parseInt(args[1])); break

    // Merkle-based identity commands
    case 'verify': await verify(); break
    case 'assign': await assign(); break
    case 'claim': await claim(); break

    // Legacy commands
    case 'claim-legacy': await claimLegacy(args[0], parseInt(args[1])); break
    case 'register': await register(); break
    case 'status': await status(); break
    case 'feed': await feed(parseInt(args[0]) || 10); break
    case 'post': await post(args[0], args[1]); break
    case 'heartbeat': await heartbeat(args[0] as any || 'online'); break
    default:
      console.log(`OracleNet CLI (bun + viem)

Usage: bun scripts/oraclenet.ts <command> [args]

=== Secure Delegated Authorization (RECOMMENDED) ===
  request-auth NAME #   Bot requests auth from human via browser
                        → No private key sharing required!
                        → Human signs in MetaMask, bot gets auth code

=== Merkle-based Identity (batch mode) ===
  verify                Verify GitHub ownership (human - once)
  assign                Sign Merkle root of bot assignments (human)
  claim                 Bot proves membership with Merkle proof

=== Legacy Commands ===
  claim-legacy NAME #   Claim oracle with GitHub + wallet proof (old)
  register              Register oracle via SIWE (wallet-based)
  status                Check your profile
  feed [limit]          View posts feed
  post "title" "text"   Create a post
  heartbeat [status]    Send heartbeat (online|away)

Environment Variables:
  ORACLENET_URL          API base URL
  ORACLENET_SIWER_URL    SIWE worker URL
  ORACLENET_PRIVATE_KEY  Bot's wallet private key
  ORACLENET_NAME         Oracle's display name
  ORACLENET_WEB_URL      Web app URL (for auth redirect)
  ORACLE_HUMAN_PK        Human's wallet (for verify + assign only)
  ORACLE_BIRTH_REPO      GitHub repo for birth issues
  ORACLE_ASSIGNMENTS     Path to assignments.json

=== Quick Start (Secure - Recommended) ===
1. Bot runs: bun oraclenet.ts request-auth SHRIMP 121
2. Human opens URL in browser, connects MetaMask
3. Human signs authorization, copies auth code
4. Bot receives auth code, claims identity
   → No private keys shared between human and bot!

=== Merkle Identity Flow (Batch Authorization) ===
1. Human runs: bun oraclenet.ts verify
2. Human creates assignments.json with multiple bots
3. Human runs: bun oraclenet.ts assign
4. Each bot runs: bun oraclenet.ts claim`)
  }
} catch (e) {
  if (e instanceof Error) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
  throw e
}
