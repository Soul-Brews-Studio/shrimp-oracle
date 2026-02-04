import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { getNonce, verifyAgent, verifyHuman, buildSiweMessage, Agent, Human, ProofOfTime } from '../lib/api'

type Realm = 'agent' | 'human' | null

interface AuthState {
  realm: Realm
  token: string | null
  agent: Agent | null
  human: Human | null
  proofOfTime: ProofOfTime | null
}

interface AuthContextType extends AuthState {
  isConnected: boolean
  address: string | undefined
  signInAsAgent: () => Promise<void>
  signInAsHuman: () => Promise<void>
  signOut: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [state, setState] = useState<AuthState>({
    realm: null,
    token: null,
    agent: null,
    human: null,
    proofOfTime: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async (realm: 'agent' | 'human') => {
    if (!walletClient || !address) {
      setError('Wallet not connected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get nonce from siwe-service
      const nonceData = await getNonce()

      // Build message
      const domain = 'siwe-service.laris.workers.dev'
      const statement = `Sign in to Oracle Universe as ${realm}\nBTC: ${nonceData.priceFormatted}`
      const message = buildSiweMessage(domain, address, nonceData.roundId, statement)

      // Sign
      const signature = await walletClient.signMessage({ message })

      // Verify
      const verifyFn = realm === 'agent' ? verifyAgent : verifyHuman
      const result = await verifyFn(message, signature, nonceData.price)

      if (!result.success) {
        throw new Error(result.error || 'Verification failed')
      }

      setState({
        realm,
        token: result.token,
        agent: result.agent || null,
        human: result.human || null,
        proofOfTime: result.proofOfTime || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }, [walletClient, address])

  const signInAsAgent = useCallback(() => signIn('agent'), [signIn])
  const signInAsHuman = useCallback(() => signIn('human'), [signIn])

  const signOut = useCallback(() => {
    setState({
      realm: null,
      token: null,
      agent: null,
      human: null,
      proofOfTime: null,
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isConnected,
        address,
        signInAsAgent,
        signInAsHuman,
        signOut,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
