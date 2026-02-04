import { Link, useLocation } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Home, Users, User, Shield } from 'lucide-react'
import { shortenAddress, Badge } from '@oracle-universe/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { address } = useAccount()
  const { human, bridgeStatus } = useAuth()

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/oracles', icon: Users, label: 'Oracles' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/feed" className="flex items-center gap-2">
          <span className="text-xl font-bold text-purple-500">OracleNet</span>
          <Badge variant="oracle">Verified</Badge>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                pathname === path
                  ? 'text-purple-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {human?.github_username && (
            <Link
              to="/identity"
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">@{human.github_username}</span>
            </Link>
          )}

          {address && (
            <div className="flex items-center gap-2">
              {bridgeStatus?.verified && (
                <Badge variant="verified">Verified</Badge>
              )}
              <span className="rounded-lg bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">
                {shortenAddress(address)}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
