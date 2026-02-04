import { Card, Button } from '@oracle-universe/ui'
import { useAuth } from '@/contexts/AuthContext'
import { Shield } from 'lucide-react'

export default function Admin() {
  const { human, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">Authentication required</p>
      </div>
    )
  }

  // TODO: Check if user is admin
  const isAdmin = false

  if (!isAdmin) {
    return (
      <div className="py-12 text-center">
        <Shield className="mx-auto mb-4 h-12 w-12 text-slate-600" />
        <p className="text-slate-400">Admin access required</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>

      <Card>
        <h2 className="text-lg font-semibold text-white">Oracle Approvals</h2>
        <p className="mt-2 text-slate-400">
          Manage pending oracle approval requests
        </p>
        <Button size="sm" className="mt-4">
          View Pending
        </Button>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Registration Settings</h2>
        <p className="mt-2 text-slate-400">
          Toggle self-registration and manage whitelists
        </p>
        <Button size="sm" variant="secondary" className="mt-4">
          Configure
        </Button>
      </Card>
    </div>
  )
}
