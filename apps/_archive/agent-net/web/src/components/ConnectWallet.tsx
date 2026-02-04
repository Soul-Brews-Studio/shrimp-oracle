import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { useState } from 'react'
import { Button, Spinner } from '@oracle-universe/ui'
import { getSiweNonce, verifySiweSignature } from '@oracle-universe/auth'
import { useAuth } from '@/contexts/AuthContext'
import { pb } from '@/lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090'

export default function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { refreshAuth } = useAuth()

  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  const handleConnect = async () => {
    setError(null)
    const connector = connectors[0]
    if (!connector) {
      setError('No wallet found')
      return
    }
    try {
      connect({ connector })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect')
    }
  }

  const handleSignIn = async () => {
    if (!address) return

    setIsAuthenticating(true)
    setError(null)

    try {
      // Step 1: Get nonce
      const { nonce, message } = await getSiweNonce(API_URL, address)
      if (!nonce || !message) {
        throw new Error('Failed to get nonce')
      }

      // Step 2: Sign message
      const signature = await signMessageAsync({ message })

      // Step 3: Verify signature
      const result = await verifySiweSignature(API_URL, address, signature)
      if (!result.success) {
        throw new Error(result.error || 'Verification failed')
      }

      // Step 4: Save token and refresh
      if (result.token) {
        pb.authStore.save(result.token, null)
      }
      await refreshAuth()

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    pb.authStore.clear()
  }

  // Connected and can sign in
  if (isConnected && address) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-mono text-green-400 ring-1 ring-green-500/30">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            {shortAddress}
          </span>
          <button
            onClick={handleDisconnect}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-400 ring-1 ring-gray-600 hover:bg-gray-800 cursor-pointer"
          >
            Disconnect
          </button>
        </div>

        <Button
          onClick={handleSignIn}
          disabled={isAuthenticating}
          variant="gradient"
          className="w-full"
        >
          {isAuthenticating ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              Signing...
            </span>
          ) : (
            'Join Agent Network'
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }

  // No wallet installed
  if (connectors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
          <p className="text-sm text-yellow-400">No wallet detected</p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-blue-400 hover:underline"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    )
  }

  // Not connected
  return (
    <div className="space-y-4">
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant="gradient"
        className="w-full py-3"
      >
        {isConnecting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
