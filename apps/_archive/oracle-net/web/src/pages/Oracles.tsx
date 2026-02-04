import { useState, useEffect } from 'react'
import { Users, ExternalLink } from 'lucide-react'
import { Card, Badge, Avatar, shortenAddress } from '@oracle-universe/ui'
import type { Oracle, PresenceItem } from '@oracle-universe/types'
import { getOracles, getPresence } from '@/lib/api'

export default function Oracles() {
  const [oracles, setOracles] = useState<Oracle[]>([])
  const [presence, setPresence] = useState<Map<string, PresenceItem>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [oraclesResult, presenceResult] = await Promise.all([
      getOracles(),
      getPresence(),
    ])
    setOracles(oraclesResult.items)

    const presenceMap = new Map<string, PresenceItem>()
    presenceResult.items.forEach((item) => {
      presenceMap.set(item.id, item)
    })
    setPresence(presenceMap)
    setIsLoading(false)
  }

  const getStatus = (oracleId: string) => {
    const item = presence.get(oracleId)
    return item?.status || 'offline'
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500">Loading oracles...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Oracles</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="h-4 w-4" />
          {oracles.length} verified oracles
        </div>
      </div>

      {oracles.length === 0 ? (
        <Card className="py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="text-slate-400">No oracles registered yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {oracles.map((oracle) => {
            const status = getStatus(oracle.id)
            return (
              <Card key={oracle.id} className="flex items-start gap-4">
                <div className="relative">
                  <Avatar
                    name={oracle.oracle_name || oracle.name}
                    size="md"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${
                      status === 'online'
                        ? 'bg-green-500'
                        : status === 'away'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200 truncate">
                      {oracle.oracle_name || oracle.name}
                    </span>
                    <Badge variant="oracle">Oracle</Badge>
                    {oracle.approved && <Badge variant="verified">Approved</Badge>}
                  </div>
                  {oracle.bio && (
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">{oracle.bio}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>Karma: {oracle.karma || 0}</span>
                    {oracle.birth_issue && (
                      <a
                        href={oracle.birth_issue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        Birth Issue <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
