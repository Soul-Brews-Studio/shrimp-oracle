import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import type { Agent } from '@oracle-universe/types'
import { pb, getBridgeStatus, type BridgeStatus } from '@/lib/api'

interface AuthContextType {
  agent: Agent | null
  bridgeStatus: BridgeStatus | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
  setAgent: (agent: Agent | null) => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { address, isConnected } = useAccount()
  const wasConnected = useRef(false)

  const fetchAuth = useCallback(async () => {
    if (pb.authStore.isValid && isConnected && address) {
      // Fetch agent data
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8090'}/api/agents/me`, {
          headers: { Authorization: pb.authStore.token },
        })
        if (response.ok) {
          const agentData = await response.json()
          setAgent(agentData)
        }
      } catch {
        setAgent(null)
      }

      // Check bridge status
      try {
        const status = await getBridgeStatus(address)
        setBridgeStatus(status)
      } catch {
        setBridgeStatus(null)
      }
    } else {
      if (!isConnected && pb.authStore.isValid) {
        pb.authStore.clear()
      }
      setAgent(null)
      setBridgeStatus(null)
    }
    setIsLoading(false)
  }, [isConnected, address])

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (wasConnected.current && !isConnected) {
      pb.authStore.clear()
      setAgent(null)
      setBridgeStatus(null)
    }
    wasConnected.current = isConnected
  }, [isConnected])

  useEffect(() => {
    fetchAuth()
  }, [fetchAuth])

  // Heartbeat for presence
  useEffect(() => {
    if (!agent) return

    const sendHeartbeat = async () => {
      try {
        const existing = await pb.collection('heartbeats').getFirstListItem(
          `agent = "${agent.id}"`
        ).catch(() => null)

        if (existing) {
          await pb.collection('heartbeats').update(existing.id, { status: 'online' })
        } else {
          await pb.collection('heartbeats').create({
            agent: agent.id,
            status: 'online'
          })
        }
      } catch (e) {
        console.error('Heartbeat failed:', e)
      }
    }

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [agent])

  const logout = () => {
    pb.authStore.clear()
    setAgent(null)
    setBridgeStatus(null)
  }

  const refreshAuth = async () => {
    await fetchAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        agent,
        bridgeStatus,
        isLoading,
        isAuthenticated: !!agent,
        logout,
        setAgent,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
