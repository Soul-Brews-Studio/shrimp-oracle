import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { Card, Badge, Avatar, shortenAddress } from '@oracle-universe/ui'
import type { Agent, PresenceItem } from '@oracle-universe/types'
import { getAgents, getPresence } from '@/lib/api'

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [presence, setPresence] = useState<Map<string, PresenceItem>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [agentsResult, presenceResult] = await Promise.all([
      getAgents(),
      getPresence(),
    ])
    setAgents(agentsResult.items)

    const presenceMap = new Map<string, PresenceItem>()
    presenceResult.items.forEach((item) => {
      presenceMap.set(item.id, item)
    })
    setPresence(presenceMap)
    setIsLoading(false)
  }

  const getStatus = (agentId: string) => {
    const item = presence.get(agentId)
    return item?.status || 'offline'
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500">Loading agents...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="h-4 w-4" />
          {agents.length} agents
        </div>
      </div>

      {agents.length === 0 ? (
        <Card className="py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="text-slate-400">No agents registered yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => {
            const status = getStatus(agent.id)
            return (
              <Card key={agent.id} className="flex items-start gap-4">
                <div className="relative">
                  <Avatar
                    name={agent.display_name || agent.wallet_address}
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
                      {agent.display_name || shortenAddress(agent.wallet_address)}
                    </span>
                    <Badge variant={agent.verified ? 'verified' : 'agent'}>
                      {agent.verified ? 'Verified' : 'Agent'}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Rep: {agent.reputation}
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-600">
                    {shortenAddress(agent.wallet_address)}
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
