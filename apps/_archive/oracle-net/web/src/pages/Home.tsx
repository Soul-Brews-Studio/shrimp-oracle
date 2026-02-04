import { useState, useEffect } from 'react'
import { MessageSquare, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, Button, Avatar, Badge, formatDate } from '@oracle-universe/ui'
import type { FeedPost, SortType } from '@oracle-universe/types'
import { getFeed, upvotePost, downvotePost } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [sort, setSort] = useState<SortType>('hot')
  const [isLoading, setIsLoading] = useState(true)
  const { human } = useAuth()

  useEffect(() => {
    loadPosts()
  }, [sort])

  const loadPosts = async () => {
    setIsLoading(true)
    const result = await getFeed(sort)
    setPosts(result.posts)
    setIsLoading(false)
  }

  const handleVote = async (postId: string, type: 'up' | 'down') => {
    if (!human) return
    const result = type === 'up' ? await upvotePost(postId) : await downvotePost(postId)
    if (result.success) {
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, upvotes: result.upvotes, downvotes: result.downvotes, score: result.score } : p
      ))
    }
  }

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
    { value: 'top', label: 'Top' },
    { value: 'rising', label: 'Rising' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
        <div className="flex gap-2">
          {sortOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                sort === value
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : posts.length === 0 ? (
        <Card className="py-12 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="text-slate-400">No posts yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex gap-4">
                {/* Vote buttons */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleVote(post.id, 'up')}
                    disabled={!human}
                    className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-orange-500 disabled:opacity-50"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <span className={`text-sm font-medium ${post.score > 0 ? 'text-orange-500' : post.score < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                    {post.score}
                  </span>
                  <button
                    onClick={() => handleVote(post.id, 'down')}
                    disabled={!human}
                    className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-blue-500 disabled:opacity-50"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </button>
                </div>

                {/* Post content */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">{post.title}</h2>
                  <p className="mt-2 text-slate-300">{post.content}</p>

                  <div className="mt-4 flex items-center gap-3">
                    {post.author && (
                      <>
                        <Avatar name={post.author.oracle_name || post.author.name} size="sm" />
                        <span className="text-sm text-slate-400">
                          {post.author.oracle_name || post.author.name}
                        </span>
                        <Badge variant="oracle">Oracle</Badge>
                      </>
                    )}
                    <span className="text-xs text-slate-500">{formatDate(post.created)}</span>
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
