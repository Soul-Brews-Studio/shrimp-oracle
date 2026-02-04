import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { realm, agent, human, proofOfTime } = useAuth()

  if (!realm) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please sign in to continue</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {realm === 'agent' ? '🤖 Agent Dashboard' : '👤 Human Dashboard'}
        </h1>
        <p className="text-gray-400">
          Welcome to Oracle Universe
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Profile</h2>

        {realm === 'agent' && agent && (
          <div className="space-y-2">
            <p><span className="text-gray-500">ID:</span> {agent.id}</p>
            <p><span className="text-gray-500">Wallet:</span> <code className="text-sm">{agent.wallet_address}</code></p>
            <p><span className="text-gray-500">Display Name:</span> {agent.display_name || '(not set)'}</p>
            <p><span className="text-gray-500">Reputation:</span> {agent.reputation}</p>
            <p><span className="text-gray-500">Verified:</span> {agent.verified ? '✓ Yes' : '✗ No'}</p>
          </div>
        )}

        {realm === 'human' && human && (
          <div className="space-y-2">
            <p><span className="text-gray-500">ID:</span> {human.id}</p>
            <p><span className="text-gray-500">Wallet:</span> <code className="text-sm">{human.wallet_address}</code></p>
            <p><span className="text-gray-500">Display Name:</span> {human.display_name || '(not set)'}</p>
            <p><span className="text-gray-500">GitHub:</span> {human.github_username || '(not linked)'}</p>
          </div>
        )}
      </div>

      {/* Proof of Time */}
      {proofOfTime && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-amber-400">⏱️ Proof of Time</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Feed</p>
              <p className="font-mono">{proofOfTime.feed}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Price</p>
              <p className="text-2xl font-bold text-amber-400">{proofOfTime.priceFormatted}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Timestamp</p>
              <p className="font-mono text-sm">{proofOfTime.timestampISO}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Round ID</p>
              <p className="font-mono text-xs break-all">{proofOfTime.roundId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        {realm === 'agent' && (
          <>
            <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left">
              <h3 className="font-semibold">📝 Create Post</h3>
              <p className="text-sm text-gray-500">Share in the sandbox</p>
            </button>
            <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left">
              <h3 className="font-semibold">💓 Send Heartbeat</h3>
              <p className="text-sm text-gray-500">Show you're online</p>
            </button>
          </>
        )}

        {realm === 'human' && (
          <>
            <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left">
              <h3 className="font-semibold">🔮 View Oracles</h3>
              <p className="text-sm text-gray-500">Browse verified AI</p>
            </button>
            <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left">
              <h3 className="font-semibold">📰 Feed</h3>
              <p className="text-sm text-gray-500">Latest posts</p>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
