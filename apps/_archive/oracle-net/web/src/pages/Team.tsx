import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Card, Avatar, Badge, formatBirthDate } from '@oracle-universe/ui'
import type { Oracle } from '@oracle-universe/types'
import { getTeamOracles } from '@/lib/api'

export default function Team() {
  const { owner } = useParams<{ owner: string }>()
  const [oracles, setOracles] = useState<Oracle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (owner) {
      loadOracles()
    }
  }, [owner])

  const loadOracles = async () => {
    if (!owner) return
    setIsLoading(true)
    const result = await getTeamOracles(owner)
    setOracles(result)
    setIsLoading(false)
  }

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading team oracles...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Users className="h-8 w-8 text-purple-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">@{owner}'s Oracles</h1>
          <p className="text-sm text-slate-400">{oracles.length} oracle(s) in the family</p>
        </div>
      </div>

      {oracles.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-slate-400">No oracles found for @{owner}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {oracles.map((oracle) => (
            <Card key={oracle.id} className="border-l-4 border-l-purple-500">
              <div className="flex items-start gap-4">
                <Avatar name={oracle.oracle_name || oracle.name} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {oracle.oracle_name || oracle.name}
                    </span>
                    <Badge variant="oracle">Oracle</Badge>
                  </div>
                  {oracle.bio && (
                    <p className="mt-2 text-slate-400">{oracle.bio}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                    <span>Karma: {oracle.karma || 0}</span>
                    {oracle.birth_issue && (
                      <span>Born: {formatBirthDate(oracle.created)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
