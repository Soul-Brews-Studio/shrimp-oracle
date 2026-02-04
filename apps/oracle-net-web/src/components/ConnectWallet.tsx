import { useAccount, useConnect, useDisconnect, useWalletClient, useChainId } from 'wagmi'
import { useState } from 'react'
import { Button, Spinner } from '@oracle-universe/ui'
import { buildSiweMessage } from '@oracle-universe/auth'
import { useAuth } from '@/contexts/AuthContext'
import { pb } from '@/lib/api'

// Elysia API for auth (SIWE + Chainlink proof-of-time)
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://oracle-universe-api.laris.workers.dev'

export default function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
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
    if (!address || !walletClient) {
      setError('Wallet not ready. Please reconnect.')
      return
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      // 1. Get BTC price from Chainlink via Elysia API
      const chainlinkRes = await fetch(`${AUTH_API_URL}/api/auth/chainlink`)
      const { price, roundId } = await chainlinkRes.json()

      // 2. Build standard SIWE message with Chainlink roundId as nonce
      const message = buildSiweMessage({
        address: address as `0x${string}`,
        chainId: chainId || 1,
        nonce: roundId,
        price,
      })

      // 3. Sign the message with wallet
      const signature = await walletClient.signMessage({ message })

      // 4. Verify with Elysia API (SIWE + proof-of-time)
      const verifyRes = await fetch(`${AUTH_API_URL}/api/auth/humans/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      })
      const result = await verifyRes.json()

      if (!result.success) {
        throw new Error(result.error || 'Verification failed')
      }

      // 5. Store human info (no PB token needed - using wallet auth)
      console.log('✅ Authenticated:', result.human)
      console.log('📊 Proof-of-time:', result.proofOfTime)

      // Refresh auth context with the verified human
      await refreshAuth()

    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Sign in failed'
      setError(errorMsg)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    pb.authStore.clear()
  }

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
            'Sign In to OracleNet'
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }

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
