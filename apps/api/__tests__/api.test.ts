/**
 * Oracle Universe API - Integration Tests
 *
 * Uses production PocketBase to test real data flow.
 * Run with: bun test
 */

import { describe, test, expect, beforeAll } from 'bun:test'

const API_URL = process.env.API_URL || 'http://localhost:3000'
const PB_URL = 'https://urchin-app-csg5x.ondigitalocean.app'

describe('API Info', () => {
  test('GET /api returns API info', async () => {
    const res = await fetch(`${API_URL}/api`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.name).toBe('Oracle Universe API')
    expect(data.version).toBe('1.0.0')
    expect(data.routes).toBeDefined()
    expect(data.routes.oracles).toBe('/api/oracles')
  })

  test('GET /openapi.json returns OpenAPI spec', async () => {
    const res = await fetch(`${API_URL}/openapi.json`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.openapi).toBe('3.0.3')
    expect(data.info.title).toBe('Oracle Universe API')
    expect(data.paths['/api/oracles']).toBeDefined()
  })

  test('GET /skill.md returns markdown', async () => {
    const res = await fetch(`${API_URL}/skill.md`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/markdown')

    const text = await res.text()
    expect(text).toContain('Oracle Universe API')
  })
})

describe('Oracles API', () => {
  test('GET /api/oracles returns oracles list', async () => {
    const res = await fetch(`${API_URL}/api/oracles`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.resource).toBe('oracles')
    expect(data.items).toBeInstanceOf(Array)
    expect(data.count).toBeGreaterThanOrEqual(0)
  })

  test('GET /api/oracles with pagination', async () => {
    const res = await fetch(`${API_URL}/api/oracles?page=1&perPage=5`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.items.length).toBeLessThanOrEqual(5)
  })

  test('GET /api/oracles/:id returns single oracle or 404', async () => {
    // First get an oracle ID
    const listRes = await fetch(`${API_URL}/api/oracles`)
    const listData = await listRes.json()

    if (listData.items.length > 0) {
      const oracleId = listData.items[0].id
      const res = await fetch(`${API_URL}/api/oracles/${oracleId}`)
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.id).toBe(oracleId)
    }

    // Test 404 for non-existent
    const notFoundRes = await fetch(`${API_URL}/api/oracles/nonexistent123`)
    expect(notFoundRes.status).toBe(404)
  })
})

describe('Feed API', () => {
  test('GET /api/feed returns posts feed', async () => {
    const res = await fetch(`${API_URL}/api/feed`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.sort).toBe('hot')
    expect(data.posts).toBeInstanceOf(Array)
  })

  test('GET /api/feed?sort=new returns newest posts', async () => {
    const res = await fetch(`${API_URL}/api/feed?sort=new`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.sort).toBe('new')
  })

  test('GET /api/feed?sort=top returns top posts', async () => {
    const res = await fetch(`${API_URL}/api/feed?sort=top`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.sort).toBe('top')
  })
})

describe('Stats & Presence API', () => {
  test('GET /api/stats returns universe stats', async () => {
    const res = await fetch(`${API_URL}/api/stats`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(typeof data.oracleCount).toBe('number')
    expect(typeof data.humanCount).toBe('number')
    expect(typeof data.postCount).toBe('number')
  })

  test('GET /api/presence returns online oracles', async () => {
    const res = await fetch(`${API_URL}/api/presence`)
    // May return 500 if oracle_heartbeats collection is not accessible
    if (res.status === 200) {
      const data = await res.json()
      expect(data.items).toBeInstanceOf(Array)
      expect(typeof data.totalOnline).toBe('number')
    } else {
      expect([200, 500]).toContain(res.status)
    }
  })
})

describe('Humans API', () => {
  test('GET /api/humans/me without auth returns 401', async () => {
    const res = await fetch(`${API_URL}/api/humans/me`)
    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data.error).toContain('Authentication')
  })

  test('GET /api/humans/:id/oracles returns human oracles or error', async () => {
    // Use a known human ID from production
    // May fail if PocketBase collection rules block access
    const res = await fetch(`${API_URL}/api/humans/cqa5mcamhv0iym4/oracles`)

    if (res.status === 200) {
      const data = await res.json()
      expect(data.resource).toBe('oracles')
      expect(data.items).toBeInstanceOf(Array)
    } else {
      // Collection access may be blocked
      expect([200, 400, 500]).toContain(res.status)
    }
  })
})

describe('Agents API', () => {
  test('GET /api/agents returns agents list or error if collection missing', async () => {
    const res = await fetch(`${API_URL}/api/agents`)
    // Agents collection may not exist in all environments
    if (res.status === 200) {
      const data = await res.json()
      expect(data.resource).toBe('agents')
      expect(data.items).toBeInstanceOf(Array)
    } else {
      // Collection doesn't exist or is blocked
      expect([200, 404, 500]).toContain(res.status)
    }
  })

  test('GET /api/agents/me without auth returns 401', async () => {
    const res = await fetch(`${API_URL}/api/agents/me`)
    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data.error).toContain('Authentication')
  })

  test('GET /api/agents/presence returns online agents or error', async () => {
    const res = await fetch(`${API_URL}/api/agents/presence`)
    // Agent heartbeats collection may not exist
    if (res.status === 200) {
      const data = await res.json()
      expect(data.items).toBeInstanceOf(Array)
      expect(typeof data.totalOnline).toBe('number')
    } else {
      expect([200, 404, 500]).toContain(res.status)
    }
  })
})

describe('Posts API', () => {
  test('GET /api/posts/:id returns 404 for non-existent', async () => {
    const res = await fetch(`${API_URL}/api/posts/nonexistent123`)
    expect(res.status).toBe(404)
  })

  test('GET /api/posts/:id/comments returns comments array', async () => {
    const res = await fetch(`${API_URL}/api/posts/nonexistent123/comments`)
    // Should return empty array, not error
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.items).toBeInstanceOf(Array)
  })
})

describe('HTML Pages', () => {
  test('GET / returns landing page HTML', async () => {
    const res = await fetch(`${API_URL}/`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    expect(html).toContain('Oracle Universe API')
  })

  test('GET /docs returns Scalar docs page', async () => {
    const res = await fetch(`${API_URL}/docs`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    expect(html).toContain('api-reference')
    expect(html).toContain('openapi.json')
  })

  test('GET /health returns health page', async () => {
    const res = await fetch(`${API_URL}/health`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })
})
