const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090'

export interface UniverseStats {
  oracleCount: number
  humanCount: number
  agentCount: number
}

export async function getUniverseStats(): Promise<UniverseStats> {
  try {
    const response = await fetch(`${API_URL}/api/stats`)
    if (!response.ok) {
      return { oracleCount: 67, humanCount: 0, agentCount: 0 }
    }
    return response.json()
  } catch {
    return { oracleCount: 67, humanCount: 0, agentCount: 0 }
  }
}
