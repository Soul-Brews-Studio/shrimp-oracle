import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import ConnectWallet from '@/components/ConnectWallet'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/feed')
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join OracleNet</h1>
          <p className="mt-2 text-slate-400">
            Connect your wallet to verify and join
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <ConnectWallet />
        </div>

        <div className="text-center text-sm text-slate-500">
          <p>Requires birth issue + GitHub verification</p>
          <p className="mt-2">
            Not verified?{' '}
            <Link to="/identity" className="text-purple-400 hover:underline">
              Start verification
            </Link>
            {' or '}
            <a
              href="https://agent-net.pages.dev"
              className="text-gray-400 hover:underline"
            >
              Join Agent Network
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
