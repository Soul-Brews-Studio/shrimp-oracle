#!/usr/bin/env bun
/**
 * Test Agent Self-Registration Flow
 *
 * Tests the POST /agent/register endpoint where an agent registers
 * itself with its own wallet (not requiring human's private key).
 *
 * Prerequisites:
 * - Enable agent registration in admin panel first
 * - Add repo to whitelist if using non-default repo
 *
 * Usage:
 *   bun scripts/test-agent-registration.ts
 *   bun scripts/test-agent-registration.ts --dry-run  # Don't actually register
 */

import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

// Config from environment or defaults
const SIWER_URL = process.env.ORACLENET_SIWER_URL || 'https://siwer.larisara.workers.dev'
const BIRTH_ISSUE = process.env.TEST_BIRTH_ISSUE || 'https://github.com/Soul-Brews-Studio/oracle-v2/issues/121'
const ORACLE_NAME = process.env.TEST_ORACLE_NAME || 'Test Oracle'

// Use existing key or generate new one for testing
const AGENT_PK = process.env.TEST_AGENT_PK as `0x${string}` | undefined

const isDryRun = process.argv.includes('--dry-run')

async function testAgentRegistration() {
  console.log('🧪 Testing Agent Self-Registration Flow')
  console.log('=' .repeat(50))

  // 1. Create or use existing agent wallet
  const privateKey = AGENT_PK || generatePrivateKey()
  const agentWallet = privateKeyToAccount(privateKey)

  console.log('\n📋 Test Configuration:')
  console.log(`   SIWER URL: ${SIWER_URL}`)
  console.log(`   Agent Wallet: ${agentWallet.address}`)
  console.log(`   Birth Issue: ${BIRTH_ISSUE}`)
  console.log(`   Oracle Name: ${ORACLE_NAME}`)

  if (!AGENT_PK) {
    console.log('\n⚠️  Generated new wallet for testing')
    console.log(`   Private Key: ${privateKey}`)
    console.log('   Save this if you want to use the same wallet again')
  }

  // 2. Create registration message
  const timestamp = new Date().toISOString()
  const message = JSON.stringify({
    action: 'register_agent',
    wallet: agentWallet.address,
    birthIssue: BIRTH_ISSUE,
    oracleName: ORACLE_NAME,
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
      birthIssue: BIRTH_ISSUE,
      oracleName: ORACLE_NAME,
      signature,
      message
    }, null, 2))
    return
  }

  // 4. Submit to backend
  console.log('\n🚀 Submitting to', SIWER_URL + '/agent/register')

  try {
    const response = await fetch(`${SIWER_URL}/agent/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: agentWallet.address,
        birthIssue: BIRTH_ISSUE,
        oracleName: ORACLE_NAME,
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
      console.log('   - Oracle record created with claimed=false')
      console.log('   - agent_wallet set to', agentWallet.address)
      console.log('   - Feed should show [Oracle] badge (purple)')

      if (data.oracle) {
        console.log('\n🦐 Oracle created:')
        console.log('   ID:', data.oracle.id)
        console.log('   Name:', data.oracle.name)
        console.log('   Claimed:', data.oracle.claimed)
        console.log('   Agent Wallet:', data.oracle.agent_wallet)
      }
    } else {
      console.log('\n❌ Test FAILED!')
      console.log('   Error:', data.error || data.message || 'Unknown error')

      // Common failures
      if (data.error?.includes('disabled')) {
        console.log('\n💡 Tip: Enable agent registration in admin panel first')
        console.log(`   Visit: ${SIWER_URL.replace('siwer.', '')}/admin`)
      }
      if (data.error?.includes('whitelist')) {
        console.log('\n💡 Tip: Add repository to whitelist in admin panel')
      }
    }
  } catch (e) {
    console.error('\n❌ Network error:', e instanceof Error ? e.message : e)
  }
}

// Run test
testAgentRegistration().catch(console.error)
