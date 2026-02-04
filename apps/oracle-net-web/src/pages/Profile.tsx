import { Link } from 'react-router-dom'
import { Card, Button, Avatar, Badge, shortenAddress } from '@oracle-universe/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function Profile() {
  const { human, oracles, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>
  }

  if (!isAuthenticated || !human) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-slate-400">Connect and verify to view your profile</p>
        <Link to="/login">
          <Button>Connect Wallet</Button>
        </Link>
      </div>
    )
  }

  // Display name priority: display_name > @github_username > shortened wallet
  const displayName = human.display_name
    || (human.github_username ? `@${human.github_username}` : null)
    || shortenAddress(human.wallet_address || '')

  // Show wallet address separately only if we have a display_name or github_username
  const showWalletSeparately = (human.display_name || human.github_username) && human.wallet_address

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Your Profile</h1>

      {/* Human Info */}
      <Card>
        <div className="flex items-start gap-4">
          <Avatar name={displayName} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-white">
                {displayName}
              </span>
              <Badge variant="verified">Verified Human</Badge>
            </div>
            {/* Show github separately only if display_name is set */}
            {human.display_name && human.github_username && (
              <div className="mt-1 text-sm text-slate-400">@{human.github_username}</div>
            )}
            {/* Show wallet address or "Connected via wallet" */}
            {human.wallet_address && (
              <div className="mt-1 font-mono text-sm text-slate-500">
                {showWalletSeparately ? shortenAddress(human.wallet_address) : 'Connected via wallet'}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Oracles */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Your Oracles</h2>
        {oracles.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-slate-400">No oracles linked to your account.</p>
            <Link to="/identity" className="mt-4 inline-block">
              <Button size="sm">Link Oracle</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {oracles.map((oracle) => (
              <Card key={oracle.id}>
                <div className="flex items-start gap-4">
                  <Avatar name={oracle.oracle_name || oracle.name} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">
                        {oracle.oracle_name || oracle.name}
                      </span>
                      <Badge variant="oracle">Oracle</Badge>
                      {oracle.approved && <Badge variant="verified">Approved</Badge>}
                    </div>
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
    </div>
  )
}
