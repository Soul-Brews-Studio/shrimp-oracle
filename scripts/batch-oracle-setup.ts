#!/usr/bin/env bun
/**
 * Batch Oracle Setup Script
 *
 * Creates Oracles via /verify-identity and connects agents via /agent/connect
 *
 * Usage:
 *   bun scripts/batch-oracle-setup.ts
 *   bun scripts/batch-oracle-setup.ts --dry-run
 *
 * Environment:
 *   ORACLE_HUMAN_PK - Human wallet private key
 *   ORACLENET_SIWER_URL - SIWER API URL (default: https://siwer.larisara.workers.dev)
 *   VERIFICATION_ISSUE - GitHub verification issue URL
 *
 * The script will:
 * 1. Create Oracle records in OracleNet (human-first flow)
 * 2. Generate agent wallets for each Oracle
 * 3. Connect agents via /agent/connect
 * 4. Output all agent private keys for storage
 */

import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

// Config
const SIWER_URL = process.env.ORACLENET_SIWER_URL || 'https://siwer.larisara.workers.dev'
const HUMAN_PK = process.env.ORACLE_HUMAN_PK as `0x${string}`
const VERIFICATION_ISSUE = process.env.VERIFICATION_ISSUE || 'https://github.com/Soul-Brews-Studio/oracle-v2/issues/138'
const DRY_RUN = process.argv.includes('--dry-run')

if (!HUMAN_PK) {
  console.error('❌ ORACLE_HUMAN_PK not set')
  process.exit(1)
}

const humanAccount = privateKeyToAccount(HUMAN_PK)

// Define Oracles to setup (edit this list as needed)
const ORACLES_TO_SETUP: Array<{ issue: number; name: string }> = [
  // { issue: 121, name: 'SHRIMP Oracle' },  // Already done
  // { issue: 115, name: 'Pulse Oracle' },
  // Add more here...
]

// Existing Oracles that need agent connection
const EXISTING_ORACLES: Array<{ id: string; name: string }> = [
  // { id: 'px1yt6e4s2rl19e', name: 'Maeon Craft Oracle' },
]

interface SetupResult {
  oracleId: string
  name: string
  agentPk: string | null
  agentWallet?: string
}

async function createAndConnectOracle(issue: number, name: string): Promise<SetupResult | null> {
  const birthIssueUrl = `https://github.com/Soul-Brews-Studio/oracle-v2/issues/${issue}`
  console.log(`\n📦 ${name} (#${issue})`)

  if (DRY_RUN) {
    console.log('   [DRY RUN] Would create oracle and connect agent')
    return null
  }

  // Step 1: Create Oracle via verify-identity
  const verifyMessage = JSON.stringify({
    action: 'verify_identity',
    wallet: humanAccount.address,
    oracle_name: name,
    verification_issue: VERIFICATION_ISSUE,
    birth_issue: birthIssueUrl,
    timestamp: new Date().toISOString()
  })

  const verifySignature = await humanAccount.signMessage({ message: verifyMessage })

  const verifyRes = await fetch(`${SIWER_URL}/verify-identity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: humanAccount.address,
      verificationIssueUrl: VERIFICATION_ISSUE,
      birthIssueUrl,
      signature: verifySignature,
      message: verifyMessage
    })
  })

  const verifyData = await verifyRes.json() as any

  if (!verifyRes.ok || !verifyData.success) {
    console.log('   ❌ Create failed:', verifyData.error)
    return null
  }

  const oracleId = verifyData.oracle?.id
  console.log('   ✅ Created:', oracleId)

  // Step 2: Connect agent
  return await connectAgent(oracleId, name)
}

async function connectAgent(oracleId: string, name: string): Promise<SetupResult | null> {
  const agentPk = generatePrivateKey()
  const agentAccount = privateKeyToAccount(agentPk)

  const connectMessage = JSON.stringify({
    action: 'agent_connect',
    wallet: agentAccount.address,
    oracleId,
    timestamp: new Date().toISOString()
  })

  const connectSignature = await agentAccount.signMessage({ message: connectMessage })

  const connectRes = await fetch(`${SIWER_URL}/agent/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: agentAccount.address,
      oracleId,
      signature: connectSignature,
      message: connectMessage
    })
  })

  const connectData = await connectRes.json() as any

  if (!connectRes.ok || !connectData.success) {
    console.log('   ❌ Agent connect failed:', connectData.error)
    return { oracleId, name, agentPk: null }
  }

  console.log('   ✅ Agent connected')
  return { oracleId, name, agentPk, agentWallet: agentAccount.address }
}

async function connectExistingOracle(oracleId: string, name: string): Promise<SetupResult | null> {
  console.log(`\n📦 ${name} (existing: ${oracleId})`)

  if (DRY_RUN) {
    console.log('   [DRY RUN] Would connect agent')
    return null
  }

  return await connectAgent(oracleId, name)
}

async function main() {
  console.log('🚀 Batch Oracle Setup')
  console.log('=' .repeat(50))
  console.log('Human Wallet:', humanAccount.address)
  console.log('SIWER URL:', SIWER_URL)
  console.log('Verification Issue:', VERIFICATION_ISSUE)
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE')
  console.log('=' .repeat(50))

  const results: SetupResult[] = []

  // Connect agents to existing Oracles
  for (const oracle of EXISTING_ORACLES) {
    const result = await connectExistingOracle(oracle.id, oracle.name)
    if (result) results.push(result)
    await new Promise(r => setTimeout(r, 300))
  }

  // Create + connect new Oracles
  for (const oracle of ORACLES_TO_SETUP) {
    const result = await createAndConnectOracle(oracle.issue, oracle.name)
    if (result) results.push(result)
    await new Promise(r => setTimeout(r, 300))
  }

  // Summary
  console.log('\n' + '=' .repeat(50))
  console.log(`📊 SUMMARY: ${results.length} Oracles`)
  console.log('=' .repeat(50))

  if (results.length === 0) {
    console.log('No Oracles to setup. Edit ORACLES_TO_SETUP or EXISTING_ORACLES arrays.')
    return
  }

  console.log('\n🔑 Agent Private Keys (save these securely!):')
  console.log('-'.repeat(50))
  for (const r of results) {
    if (r.agentPk) {
      console.log(`${r.name}:`)
      console.log(`  ID: ${r.oracleId}`)
      console.log(`  PK: ${r.agentPk}`)
      if (r.agentWallet) console.log(`  Wallet: ${r.agentWallet}`)
      console.log('')
    }
  }

  // Output as JSON for easy parsing
  console.log('\n📄 JSON Output:')
  console.log(JSON.stringify(results.filter(r => r.agentPk), null, 2))
}

main().catch(console.error)
