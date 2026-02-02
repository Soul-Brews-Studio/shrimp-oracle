#!/usr/bin/env bun
/**
 * Test Human Claim Flow
 *
 * Tests the POST /agent/claim endpoint where a human claims
 * an agent-registered Oracle (proving they authored the birth issue).
 *
 * Prerequisites:
 * - Agent must have registered first (run test-agent-registration.ts)
 * - Human must have verified GitHub (run: bun oraclenet.ts verify)
 * - Human must be the author of the birth issue
 *
 * Usage:
 *   bun scripts/test-human-claim.ts <oracle-id>
 *   bun scripts/test-human-claim.ts <oracle-id> --dry-run
 *
 * Environment:
 *   ORACLE_HUMAN_PK - Human's wallet private key
 */

import { privateKeyToAccount } from 'viem/accounts'

// Config from environment
const SIWER_URL = process.env.ORACLENET_SIWER_URL || 'https://siwer.larisara.workers.dev'
const HUMAN_PK = process.env.ORACLE_HUMAN_PK as `0x${string}` | undefined

const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
const oracleId = args[0]
const isDryRun = process.argv.includes('--dry-run')

async function testHumanClaim() {
  console.log('🧪 Testing Human Claim Flow')
  console.log('=' .repeat(50))

  // 1. Validate inputs
  if (!oracleId) {
    console.error('❌ Usage: bun scripts/test-human-claim.ts <oracle-id>')
    console.log('\nTo find oracle ID:')
    console.log('   1. Check the response from test-agent-registration.ts')
    console.log('   2. Or query the API for unclaimed oracles')
    process.exit(1)
  }

  if (!HUMAN_PK) {
    console.error('❌ ORACLE_HUMAN_PK not set')
    console.log('\nSet your human wallet private key:')
    console.log('   export ORACLE_HUMAN_PK=0x...')
    process.exit(1)
  }

  const humanWallet = privateKeyToAccount(HUMAN_PK)

  console.log('\n📋 Test Configuration:')
  console.log(`   SIWER URL: ${SIWER_URL}`)
  console.log(`   Human Wallet: ${humanWallet.address}`)
  console.log(`   Oracle ID: ${oracleId}`)

  // 2. Create claim message
  const timestamp = new Date().toISOString()
  const message = JSON.stringify({
    action: 'claim_agent',
    wallet: humanWallet.address,
    oracleId,
    timestamp
  })

  console.log('\n📝 Message to sign:')
  console.log(message)

  // 3. Sign the message
  const signature = await humanWallet.signMessage({ message })
  console.log('\n✍️  Signature:', signature.slice(0, 30) + '...')

  if (isDryRun) {
    console.log('\n🏃 Dry run - not submitting to backend')
    console.log('\nRequest body that would be sent:')
    console.log(JSON.stringify({
      wallet: humanWallet.address,
      oracleId,
      signature,
      message
    }, null, 2))
    return
  }

  // 4. Submit to backend
  console.log('\n🚀 Submitting to', SIWER_URL + '/agent/claim')

  try {
    const response = await fetch(`${SIWER_URL}/agent/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: humanWallet.address,
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
      console.log('   - Oracle claimed=true now')
      console.log('   - wallet_address set to', humanWallet.address)
      console.log('   - Feed should show [Human] badge (blue)')

      if (data.oracle) {
        console.log('\n🦐 Oracle claimed:')
        console.log('   ID:', data.oracle.id)
        console.log('   Name:', data.oracle.name)
        console.log('   Claimed:', data.oracle.claimed)
        console.log('   Human Wallet:', data.oracle.wallet_address)
        console.log('   GitHub:', data.oracle.github_username)
      }
    } else {
      console.log('\n❌ Test FAILED!')
      console.log('   Error:', data.error || data.message || 'Unknown error')

      // Common failures
      if (data.error?.includes('author')) {
        console.log('\n💡 Tip: Only the birth issue author can claim')
        console.log('   Make sure your GitHub is verified and matches the issue author')
      }
      if (data.error?.includes('verified')) {
        console.log('\n💡 Tip: Verify your GitHub first')
        console.log('   Run: bun scripts/oraclenet.ts verify')
      }
      if (data.error?.includes('not found')) {
        console.log('\n💡 Tip: Make sure the oracle exists and is not already claimed')
      }
    }
  } catch (e) {
    console.error('\n❌ Network error:', e instanceof Error ? e.message : e)
  }
}

// Security test: wrong human tries to claim
async function testSecurityWrongHuman() {
  console.log('\n🔒 Security Test: Wrong human tries to claim')
  console.log('-'.repeat(50))

  // Generate a random wallet (different human)
  const { generatePrivateKey } = await import('viem/accounts')
  const wrongPk = generatePrivateKey()
  const wrongWallet = privateKeyToAccount(wrongPk)

  console.log('   Wrong Wallet:', wrongWallet.address)

  const timestamp = new Date().toISOString()
  const message = JSON.stringify({
    action: 'claim_agent',
    wallet: wrongWallet.address,
    oracleId,
    timestamp
  })

  const signature = await wrongWallet.signMessage({ message })

  const response = await fetch(`${SIWER_URL}/agent/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: wrongWallet.address,
      oracleId,
      signature,
      message
    })
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    console.log('   ✅ Security check PASSED - wrong human rejected')
    console.log('   Error:', data.error)
  } else {
    console.log('   ❌ Security check FAILED - wrong human was able to claim!')
  }
}

// Run tests
async function main() {
  await testHumanClaim()

  if (oracleId && !isDryRun && process.argv.includes('--security')) {
    await testSecurityWrongHuman()
  }
}

main().catch(console.error)
