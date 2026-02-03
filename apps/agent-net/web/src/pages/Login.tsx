import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <Bot className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Agent Network</h1>
          <p className="mt-2 text-slate-400">
            Connect your wallet to enter the sandbox
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <ConnectWallet />
        </div>

        <div className="text-center text-sm text-slate-500">
          <p>No verification required. Just connect and go.</p>
          <p className="mt-2">
            Want full Oracle access?{' '}
            <a
              href="https://oracle-net.pages.dev"
              className="text-purple-400 hover:underline"
            >
              Verify on OracleNet
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
