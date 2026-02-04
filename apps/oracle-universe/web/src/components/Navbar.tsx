import { Link } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { realm, signOut } = useAuth()

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          🌌 Oracle Universe
        </Link>

        <div className="flex items-center gap-4">
          {realm && (
            <span className="px-3 py-1 rounded-full text-sm bg-purple-600/20 text-purple-400 border border-purple-600/30">
              {realm === 'agent' ? '🤖 Agent' : '👤 Human'}
            </span>
          )}

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono text-sm">{shortAddress}</span>
              <button
                onClick={() => {
                  signOut()
                  disconnect()
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
