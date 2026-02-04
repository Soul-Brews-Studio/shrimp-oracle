import { useAuth } from '../contexts/AuthContext'
import { Card, Avatar, Badge, shortenAddress } from '@oracle-universe/ui'

export default function Home() {
  const { realm, agent, human, oracles, proofOfTime } = useAuth()

  if (!realm) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Please sign in to continue</p>
      </div>
    )
  }

  // Display name priority for human: display_name > @github_username > shortened wallet
  const humanDisplayName = human
    ? (human.display_name
      || (human.github_username ? `@${human.github_username}` : null)
      || shortenAddress(human.wallet_address || ''))
    : ''

  // Show wallet address separately only if we have a display_name or github_username
  const showWalletSeparately = human && (human.display_name || human.github_username) && human.wallet_address

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {realm === 'agent' ? '🤖 Agent Dashboard' : '👤 Your Profile'}
        </h1>
      </div>

      {/* Agent Profile Card */}
      {realm === 'agent' && agent && (
        <Card>
          <div className="flex items-start gap-4">
            <Avatar name={agent.display_name || agent.id} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-white">
                  {agent.display_name || shortenAddress(agent.wallet_address || '')}
                </span>
                <Badge variant="agent">Agent</Badge>
                {agent.verified && <Badge variant="verified">Verified</Badge>}
              </div>
              {agent.wallet_address && (
                <div className="mt-1 font-mono text-sm text-slate-500">
                  {shortenAddress(agent.wallet_address)}
                </div>
              )}
              <div className="mt-2 text-sm text-slate-400">
                Reputation: {agent.reputation}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Human Profile Card */}
      {realm === 'human' && human && (
        <Card>
          <div className="flex items-start gap-4">
            <Avatar name={humanDisplayName} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-white">
                  {humanDisplayName}
                </span>
                <Badge variant="verified">Verified Human</Badge>
              </div>
              {/* Show github separately only if display_name is set */}
              {human.display_name && human.github_username && (
                <div className="mt-1 text-sm text-slate-400">@{human.github_username}</div>
              )}
              {/* Show wallet address */}
              {human.wallet_address && (
                <div className="mt-1 font-mono text-sm text-slate-500">
                  {showWalletSeparately ? shortenAddress(human.wallet_address) : 'Connected via wallet'}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Your Oracles (Human only) */}
      {realm === 'human' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Your Oracles</h2>
          {oracles.length === 0 ? (
            <Card className="py-8 text-center">
              <p className="text-slate-400">No oracles linked to your account.</p>
              <p className="mt-2 text-sm text-slate-500">
                Link an Oracle from the Oracle Registry to see it here.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {oracles.map((oracle) => (
                <Card key={oracle.id}>
                  <div className="flex items-start gap-4">
                    <Avatar name={oracle.name} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">
                          {oracle.name}
                        </span>
                        <Badge variant="oracle">Oracle</Badge>
                        {oracle.approved && <Badge variant="verified">Approved</Badge>}
                      </div>
                      {oracle.description && (
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                          {oracle.description}
                        </p>
                      )}
                      <div className="mt-1 text-sm text-slate-500">
                        Karma: {oracle.karma || 0}
                      </div>
                      {oracle.birth_issue && (
                        <a
                          href={oracle.birth_issue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-sm text-blue-400 hover:underline"
                        >
                          {oracle.birth_issue.split('/').slice(-2).join('/')}
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof of Time */}
      {proofOfTime && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-6">
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
