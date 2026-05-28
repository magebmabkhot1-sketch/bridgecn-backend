import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createPostSchema = z.object({
  content: z.string().min(1, { message: 'Content is required' }).max(5000, { message: 'Content too long' }),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([])
})

export const createPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId
    const validated = createPostSchema.parse(req.body)

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content: validated.content,
        imageUrl: validated.imageUrl,
        tags: {
          create: validated.tags.map((tag: string) => ({ tag }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            avatar: true,
            university: true
          }
        },
        tags: true,
        postLikes: {
          where: { userId },
          select: { id: true }
        },
        _count: {
          select: { postLikes: true, postComments: true }
        }
      }
    })

    const postData = {
      ...post,
      likedByUser: post.postLikes.length > 0,
      likesCount: post._count.postLikes,
      commentsCount: post._count.postComments,
      tags: post.tags.map(t => t.tag)
    }

    return res.status(201).json({
      message: 'Post created successfully',
      post: postData
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      })
    }
    
    console.error('Create post error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'CREATE_POST_FAILED'
    })
  }
}

export const getAllPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            avatar: true,
            university: true
          }
        },
        tags: true,
        postLikes: {
          where: { userId },
          select: { id: true }
        },
        _count: {
          select: { postLikes: true, postComments: true }
        }
      }
    })

    const total = await prisma.post.count()

    const postsData = posts.map(post => ({
      ...post,
      likedByUser: post.postLikes.length > 0,
      likesCount: post._count.postLikes,
      commentsCount: post._count.postComments,
      tags: post.tags.map(t => t.tag)
    }))

    return res.json({
      posts: postsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'GET_POSTS_FAILED'
    })
  }
}

export const likePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId
    const { postId } = req.params

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    if (existingLike) {
      return res.status(400).json({ 
        message: 'Already liked this post',
        error: 'ALREADY_LIKED'
      })
    }

    await prisma.$transaction([
      prisma.like.create({
        data: {
          postId,
          userId
        }
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })
    ])

    return res.json({ message: 'Post liked successfully' })
  } catch (error) {
    console.error('Like post error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'LIKE_POST_FAILED'
    })
  }
}

export const unlikePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId
    const { postId } = req.params

    await prisma.$transaction([
      prisma.like.deleteMany({
        where: {
          postId,
          userId
        }
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })
    ])

    return res.json({ message: 'Post unliked successfully' })
  } catch (error) {
    console.error('Unlike post error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'UNLIKE_POST_FAILED'
    })
  }
}

export const addComment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId
    const { postId } = req.params
    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        message: 'Comment content is required',
        error: 'EMPTY_COMMENT'
      })
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            avatar: true
          }
        }
      }
    })

    await prisma.post.update({
      where: { id: postId },
      data: { comments: { increment: 1 } }
    })

    return res.status(201).json({
      message: 'Comment added successfully',
      comment
    })
  } catch (error) {
    console.error('Add comment error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'ADD_COMMENT_FAILED'
    })
  }
}

export const getPostComments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { postId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const comments = await prisma.comment.findMany({
      where: { postId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            avatar: true
          }
        }
      }
    })

    const total = await prisma.comment.count({
      where: { postId }
    })

    return res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'GET_COMMENTS_FAILED'
    })
  }
}