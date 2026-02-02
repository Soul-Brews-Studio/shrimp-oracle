#!/usr/bin/env bun
/**
 * OracleNet Admin CLI
 *
 * Quick admin operations without opening the web panel.
 *
 * Usage:
 *   bun scripts/admin.ts registration on
 *   bun scripts/admin.ts registration off
 *   bun scripts/admin.ts whitelist add Soul-Brews-Studio/oracle-v2
 *   bun scripts/admin.ts whitelist remove Soul-Brews-Studio/oracle-v2
 *   bun scripts/admin.ts whitelist list
 *   bun scripts/admin.ts status
 *
 * Environment:
 *   ORACLENET_SIWER_URL    API URL
 *   PB_ADMIN_EMAIL         PocketBase admin email
 *   PB_ADMIN_PASSWORD      PocketBase admin password
 */

const SIWER_URL = process.env.ORACLENET_SIWER_URL || 'https://siwer.larisara.workers.dev'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

function requireAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Admin credentials required')
    console.log('   Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD')
    process.exit(1)
  }
}

async function apiCall(endpoint: string, method = 'GET', body?: object) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const res = await fetch(`${SIWER_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  return res.json()
}

async function updateSetting(key: string, enabled: boolean, value?: string) {
  requireAdmin()

  const body: any = {
    key,
    enabled,
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD
  }
  if (value !== undefined) body.value = value

  const res = await fetch(`${SIWER_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  return res.json()
}

async function getStatus() {
  console.log('📊 OracleNet Admin Status')
  console.log('='.repeat(40))
  console.log(`   API: ${SIWER_URL}`)

  try {
    const data = await apiCall('/admin/status')
    console.log(`   Registration: ${data.agentRegistration ? '✅ ON' : '❌ OFF'}`)
    console.log(`   Whitelist: ${data.whitelist?.length || 0} repos`)
    if (data.whitelist?.length) {
      data.whitelist.forEach((repo: string) => console.log(`      - ${repo}`))
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch status (endpoint may not exist)')
  }
}

async function toggleRegistration(enable: boolean) {
  console.log(`${enable ? '✅' : '❌'} Setting agent registration: ${enable ? 'ON' : 'OFF'}`)

  try {
    const data = await updateSetting('allow_agent_registration', enable)
    if (data.success) {
      console.log('   Done!')
    } else {
      console.log('   Error:', data.error || 'Unknown error')
    }
  } catch (e) {
    console.error('   Failed:', e instanceof Error ? e.message : e)
  }
}

async function manageWhitelist(action: string, repo?: string) {
  if (action === 'list') {
    const data = await apiCall('/admin/status')
    console.log('📋 Whitelisted repositories:')
    const repos = data.whitelisted_repos?.split(',').map((s: string) => s.trim()).filter(Boolean) || []
    if (repos.length) {
      repos.forEach((r: string) => console.log(`   - ${r}`))
    } else {
      console.log('   (none)')
    }
    return
  }

  if (!repo) {
    console.error('❌ Usage: bun scripts/admin.ts whitelist <add|remove> <repo>')
    return
  }

  // Get current whitelist
  const statusData = await apiCall('/admin/status')
  const currentRepos = (statusData.whitelisted_repos || '').split(',').map((s: string) => s.trim()).filter(Boolean)

  let newRepos: string[]
  if (action === 'add') {
    if (currentRepos.includes(repo)) {
      console.log(`ℹ️  ${repo} already in whitelist`)
      return
    }
    newRepos = [...currentRepos, repo]
  } else {
    newRepos = currentRepos.filter((r: string) => r !== repo)
  }

  const data = await updateSetting('whitelisted_repos', true, newRepos.join(','))

  if (data.success) {
    console.log(`✅ ${action === 'add' ? 'Added' : 'Removed'}: ${repo}`)
  } else {
    console.log('❌ Error:', data.error || 'Unknown error')
  }
}

// Parse args
const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'status':
    await getStatus()
    break

  case 'registration':
  case 'reg':
    const state = args[0]?.toLowerCase()
    if (state === 'on' || state === 'true' || state === 'enable') {
      await toggleRegistration(true)
    } else if (state === 'off' || state === 'false' || state === 'disable') {
      await toggleRegistration(false)
    } else {
      console.log('Usage: bun scripts/admin.ts registration <on|off>')
    }
    break

  case 'whitelist':
  case 'wl':
    await manageWhitelist(args[0], args[1])
    break

  default:
    console.log(`OracleNet Admin CLI

Usage: bun scripts/admin.ts <command> [args]

Commands:
  status                    Show current admin status
  registration <on|off>     Enable/disable agent registration
  whitelist list            List whitelisted repos
  whitelist add <repo>      Add repo to whitelist
  whitelist remove <repo>   Remove repo from whitelist

Environment:
  ORACLENET_SIWER_URL      API URL (default: https://siwer.larisara.workers.dev)
  ORACLENET_ADMIN_KEY      Admin API key (if required)

Examples:
  bun scripts/admin.ts registration on
  bun scripts/admin.ts wl add Soul-Brews-Studio/oracle-v2
`)
}
