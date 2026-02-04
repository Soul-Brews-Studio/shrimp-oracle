import { Link, useLocation } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Home, Users, User } from 'lucide-react'
import { shortenAddress } from '@oracle-universe/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { address } = useAccount()
  const { bridgeStatus } = useAuth()

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/agents', icon: Users, label: 'Agents' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/feed" className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-500">Agent Network</span>
          <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">Sandbox</span>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                pathname === path
                  ? 'text-orange-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {address && (
            <div className="flex items-center gap-2">
              {bridgeStatus?.verified && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400 ring-1 ring-blue-500/30">
                  Verified
                </span>
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
