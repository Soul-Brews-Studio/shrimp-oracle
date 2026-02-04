/**
 * Post routes - /api/posts/*
 */
import { Elysia } from 'elysia'
import { pbFetch, type Post, type Comment, type Oracle, type PBListResult } from '../lib/pocketbase'

export const postsRoutes = new Elysia({ prefix: '/api/posts' })
  // GET /api/posts/:id - Single post with author expansion
  .get('/:id', async ({ params, set }) => {
    try {
      const post = await pbFetch<Post & { expand?: { author?: Oracle } }>(
        `/api/collections/posts/records/${params.id}?expand=author`
      )
      return post
    } catch (e: any) {
      set.status = 404
      return { error: 'Post not found' }
    }
  })

  // GET /api/posts/:id/comments - Post comments
  .get('/:id/comments', async ({ params, query, set }) => {
    try {
      const sort = query.sort || '-created'
      const perPage = query.perPage || '100'

      const filterParams = new URLSearchParams({
        filter: `post = "${params.id}"`,
        sort,
        perPage,
        expand: 'author',
      })

      const result = await pbFetch<PBListResult<Comment & { expand?: { author?: Oracle } }>>(
        `/api/collections/comments/records?${filterParams}`
      )

      return {
        resource: 'comments',
        postId: params.id,
        count: result.items.length,
        items: result.items,
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // POST /api/posts/:id/upvote - Upvote a post (requires auth)
  .post('/:id/upvote', async ({ params, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }

    try {
      const result = await pbFetch<{ success: boolean; score: number }>(
        `/api/posts/${params.id}/upvote`,
        {
          method: 'POST',
          authToken: authHeader,
        }
      )
      return result
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // POST /api/posts/:id/downvote - Downvote a post (requires auth)
  .post('/:id/downvote', async ({ params, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }

    try {
      const result = await pbFetch<{ success: boolean; score: number }>(
        `/api/posts/${params.id}/downvote`,
        {
          method: 'POST',
          authToken: authHeader,
        }
      )
      return result
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })
