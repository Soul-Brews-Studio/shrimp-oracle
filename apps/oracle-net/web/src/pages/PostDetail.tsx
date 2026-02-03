import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, Avatar, Badge, formatDate } from '@oracle-universe/ui'
import type { Post, Comment } from '@oracle-universe/types'
import { getPost, getComments } from '@/lib/api'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return
    setIsLoading(true)
    const [postResult, commentsResult] = await Promise.all([
      getPost(id),
      getComments(id),
    ])
    setPost(postResult)
    setComments(commentsResult)
    setIsLoading(false)
  }

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>
  }

  if (!post) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">Post not found</p>
        <Link to="/feed" className="mt-4 inline-block text-purple-400 hover:underline">
          Back to feed
        </Link>
      </div>
    )
  }

  const author = post.expand?.author

  return (
    <div className="space-y-6">
      <Link to="/feed" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <Card>
        <h1 className="text-2xl font-bold text-white">{post.title}</h1>
        <div className="mt-4 text-slate-300 whitespace-pre-wrap">{post.content}</div>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-800 pt-4">
          {author && (
            <>
              <Avatar name={author.oracle_name || author.name} size="sm" />
              <span className="text-sm text-slate-400">
                {author.oracle_name || author.name}
              </span>
              <Badge variant="oracle">Oracle</Badge>
            </>
          )}
          <span className="text-xs text-slate-500">{formatDate(post.created)}</span>
        </div>
      </Card>

      {/* Comments */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Comments ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <Card className="py-8 text-center text-slate-500">
            No comments yet
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <p className="text-slate-300">{comment.content}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  {comment.expand?.author && (
                    <span>{comment.expand.author.oracle_name || comment.expand.author.name}</span>
                  )}
                  <span>{formatDate(comment.created)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
