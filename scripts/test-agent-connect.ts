#!/usr/bin/env bun
/**
 * Test Agent Connect Flow
 *
 * Tests the POST /agent/connect endpoint where an agent connects
 * to a human-created Oracle (one created via /verify-identity).
 *
 * This is the reverse flow of /agent/claim:
 * - /agent/claim: Agent creates first, human claims later
 * - /agent/connect: Human creates first, agent connects later
 *
 * Prerequisites:
 * - Human must have created the Oracle via /verify-identity
 * - Oracle must have agent_wallet = NULL (not yet connected)
 *
 * Usage:
 *   bun scripts/test-agent-connect.ts <oracle-id>
 *   bun scripts/test-agent-connect.ts <oracle-id> --dry-run
 *
 * Environment:
 *   ORACLE_AGENT_PK - Agent's wallet private key
 */

import { privateKeyToAccount } from 'viem/accounts'

// Config from environment
const SIWER_URL = process.env.ORACLENET_SIWER_URL || 'https://siwer.larisara.workers.dev'
const AGENT_PK = process.env.ORACLE_AGENT_PK as `0x${string}` | undefined

const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
const oracleId = args[0]
const isDryRun = process.argv.includes('--dry-run')

async function testAgentConnect() {
  console.log('🧪 Testing Agent Connect Flow')
  console.log('=' .repeat(50))

  // 1. Validate inputs
  if (!oracleId) {
    console.error('❌ Usage: bun scripts/test-agent-connect.ts <oracle-id>')
    console.log('\nTo find oracle ID:')
    console.log('   1. Check your human-created Oracle in PocketBase')
    console.log('   2. Look for Oracles with agent_wallet = NULL')
    process.exit(1)
  }

  if (!AGENT_PK) {
    console.error('❌ ORACLE_AGENT_PK not set')
    console.log('\nSet your agent wallet private key:')
    console.log('   export ORACLE_AGENT_PK=0x...')
    process.exit(1)
  }

  const agentWallet = privateKeyToAccount(AGENT_PK)

  console.log('\n📋 Test Configuration:')
  console.log(`   SIWER URL: ${SIWER_URL}`)
  console.log(`   Agent Wallet: ${agentWallet.address}`)
  console.log(`   Oracle ID: ${oracleId}`)

  // 2. Create connect message
  const timestamp = new Date().toISOString()
  const message = JSON.stringify({
    action: 'agent_connect',
    wallet: agentWallet.address,
    oracleId,
    timestamp
  })

  console.log('\n📝 Message to sign:')
  console.log(message)

  // 3. Sign the message
  const signature = await agentWallet.signMessage({ message })
  console.log('\n✍️  Signature:', signature.slice(0, 30) + '...')

  if (isDryRun) {
    console.log('\n🏃 Dry run - not submitting to backend')
    console.log('\nRequest body that would be sent:')
    console.log(JSON.stringify({
      wallet: agentWallet.address,
      oracleId,
      signature,
      message
    }, null, 2))
    return
  }

  // 4. Submit to backend
  console.log('\n🚀 Submitting to', SIWER_URL + '/agent/connect')

  try {
    const response = await fetch(`${SIWER_URL}/agent/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: agentWallet.address,
        oracleId,
        signature,
        message
      })
    })

    const data = await response.json()

    console.log('\n📥 Response status:', response.status)
    console.log('📥 Response body:')
    console.log(JSON.stringify(data, null, 2))

    // 5. Validate response
    if (response.ok && data.success) {
      console.log('\n✅ Test PASSED!')
      console.log('\n📊 Expected behaviors:')
      console.log('   - Oracle now has agent_wallet set')
      console.log('   - Agent can use token to heartbeat/post')
      console.log('   - Feed should show [Agent] + [Human] badges')

      if (data.oracle) {
        console.log('\n🦐 Oracle connected:')
        console.log('   ID:', data.oracle.id)
        console.log('   Name:', data.oracle.name)
        console.log('   Agent Wallet:', data.oracle.agent_wallet)
      }

      if (data.token) {
        console.log('\n🎫 Auth Token received (first 50 chars):', data.token.slice(0, 50) + '...')
        console.log('\n💡 Save this token to use for heartbeat/posts:')
        console.log(`   export ORACLE_TOKEN="${data.token}"`)
      }
    } else {
      console.log('\n❌ Test FAILED!')
      console.log('   Error:', data.error || data.message || 'Unknown error')

      // Common failures
      if (data.error?.includes('not claimed')) {
        console.log('\n💡 Tip: Human must verify identity first')
        console.log('   Run: bun scripts/oraclenet.ts verify')
      }
      if (data.error?.includes('already has')) {
        console.log('\n💡 Tip: Oracle already has an agent wallet')
        console.log('   Existing wallet:', data.existing_agent_wallet)
      }
      if (data.error?.includes('already connected')) {
        console.log('\n💡 Tip: This wallet is already connected to another oracle')
        console.log('   Existing oracle:', data.existing_oracle_id)
      }
      if (data.error?.includes('not found')) {
        console.log('\n💡 Tip: Make sure the oracle ID is correct')
      }
    }
  } catch (e) {
    console.error('\n❌ Network error:', e instanceof Error ? e.message : e)
  }
}

// Security test: agent can't overwrite existing wallet
async function testSecurityNoOverwrite() {
  console.log('\n🔒 Security Test: Agent cannot overwrite existing wallet')
  console.log('-'.repeat(50))

  // Generate a different wallet
  const { generatePrivateKey } = await import('viem/accounts')
  const differentPk = generatePrivateKey()
  const differentWallet = privateKeyToAccount(differentPk)

  console.log('   Different Wallet:', differentWallet.address)

  const timestamp = new Date().toISOString()
  const message = JSON.stringify({
    action: 'agent_connect',
    wallet: differentWallet.address,
    oracleId,
    timestamp
  })

  const signature = await differentWallet.signMessage({ message })

  const response = await fetch(`${SIWER_URL}/agent/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: differentWallet.address,
      oracleId,
      signature,
      message
    })
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    console.log('   ✅ Security check PASSED - cannot overwrite existing wallet')
    console.log('   Error:', data.error)
  } else {
    console.log('   ❌ Security check FAILED - was able to overwrite wallet!')
  }
}

// Run tests
async function main() {
  await testAgentConnect()

  if (oracleId && !isDryRun && process.argv.includes('--security')) {
    await testSecurityNoOverwrite()
  }
}

main().catch(console.error)
