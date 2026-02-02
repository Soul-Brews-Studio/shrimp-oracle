#!/usr/bin/env bun
/**
 * Test Team Oracles API
 *
 * Tests the getTeamOracles() function that fetches oracles owned by a human.
 * This verifies the Team UI feature works correctly.
 *
 * Usage:
 *   bun scripts/test-team-api.ts
 *   bun scripts/test-team-api.ts nazt          # Test specific user
 *   bun scripts/test-team-api.ts --with-presence  # Include presence data
 */

const API_URL = process.env.ORACLENET_API_URL || 'https://urchin-app-csg5x.ondigitalocean.app'

const testUser = process.argv[2]?.startsWith('--') ? 'nazt' : (process.argv[2] || 'nazt')
const withPresence = process.argv.includes('--with-presence')

interface Oracle {
  id: string
  name: string
  oracle_name?: string
  github_username?: string
  birth_issue?: string
  claimed?: boolean
  agent_wallet?: string
  wallet_address?: string
  created: string
}

interface PresenceItem {
  id: string
  name: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string
}

async function getTeamOracles(github_username: string): Promise<Oracle[]> {
  const params = new URLSearchParams({
    filter: `github_username = "${github_username}" && birth_issue != ""`,
    sort: 'name',
  })
  const response = await fetch(`${API_URL}/api/collections/oracles/records?${params}`)
  if (!response.ok) {
    console.error('❌ API error:', response.status, response.statusText)
    return []
  }
  const data = await response.json()
  return data.items || []
}

async function getPresence(): Promise<{ items: PresenceItem[] }> {
  const response = await fetch(`${API_URL}/api/oracles/presence`)
  if (!response.ok) return { items: [] }
  return response.json()
}

async function testTeamAPI() {
  console.log('🧪 Testing Team Oracles API')
  console.log('='.repeat(50))
  console.log(`   API URL: ${API_URL}`)
  console.log(`   Test User: ${testUser}`)
  console.log(`   With Presence: ${withPresence}`)
  console.log()

  // 1. Fetch team oracles
  console.log(`📥 Fetching oracles for @${testUser}...`)
  const startTime = Date.now()
  const oracles = await getTeamOracles(testUser)
  const fetchTime = Date.now() - startTime

  console.log(`   Found: ${oracles.length} oracle(s) in ${fetchTime}ms`)
  console.log()

  if (oracles.length === 0) {
    console.log('⚠️  No oracles found for this user')
    console.log('   This could mean:')
    console.log('   - User has no claimed oracles')
    console.log('   - github_username or birth_issue not set')
    console.log()

    // Show what oracles exist
    console.log('📋 Checking all oracles...')
    const allResponse = await fetch(`${API_URL}/api/collections/oracles/records?perPage=10`)
    const allData = await allResponse.json()
    console.log(`   Total oracles in system: ${allData.totalItems}`)

    if (allData.items?.length > 0) {
      console.log('\n   Sample oracles:')
      allData.items.slice(0, 5).forEach((o: Oracle) => {
        console.log(`   - ${o.name} (github: ${o.github_username || 'none'}, birth: ${o.birth_issue ? 'yes' : 'no'})`)
      })
    }
    return
  }

  // 2. Display oracles
  console.log('📋 Team Oracles:')
  console.log('-'.repeat(50))

  let presenceMap: Map<string, PresenceItem> = new Map()
  if (withPresence) {
    const presence = await getPresence()
    presence.items.forEach(p => presenceMap.set(p.name, p))
  }

  oracles.forEach((oracle, i) => {
    const presence = presenceMap.get(oracle.name)
    const statusIcon = presence?.status === 'online' ? '🟢' : presence?.status === 'away' ? '🟡' : '⚫'

    console.log(`\n${i + 1}. ${oracle.name}`)
    console.log(`   ID: ${oracle.id}`)
    if (oracle.oracle_name) console.log(`   Oracle Name: ${oracle.oracle_name}`)
    console.log(`   GitHub: @${oracle.github_username}`)
    console.log(`   Birth Issue: ${oracle.birth_issue}`)
    console.log(`   Claimed: ${oracle.claimed ? '✅ Yes' : '❌ No'}`)
    if (oracle.agent_wallet) console.log(`   Agent Wallet: ${oracle.agent_wallet.slice(0, 10)}...`)
    if (oracle.wallet_address) console.log(`   Human Wallet: ${oracle.wallet_address.slice(0, 10)}...`)
    if (withPresence) console.log(`   Status: ${statusIcon} ${presence?.status || 'offline'}`)
    console.log(`   Created: ${new Date(oracle.created).toLocaleString()}`)
  })

  // 3. Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`   Total oracles: ${oracles.length}`)

  const claimed = oracles.filter(o => o.claimed).length
  const unclaimed = oracles.length - claimed
  console.log(`   Claimed: ${claimed}`)
  console.log(`   Unclaimed: ${unclaimed}`)

  if (withPresence) {
    const online = oracles.filter(o => presenceMap.get(o.name)?.status === 'online').length
    const away = oracles.filter(o => presenceMap.get(o.name)?.status === 'away').length
    const offline = oracles.length - online - away
    console.log(`   Online: ${online} | Away: ${away} | Offline: ${offline}`)
  }

  console.log('\n✅ Team API test complete!')
}

// Run test
testTeamAPI().catch(console.error)
