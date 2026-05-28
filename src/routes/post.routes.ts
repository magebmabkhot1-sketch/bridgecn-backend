import { Router } from 'express'
import { 
  createPost, 
  getAllPosts, 
  likePost, 
  unlikePost, 
  addComment, 
  getPostComments 
} from '../controllers/post.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authenticateToken, createPost)
router.get('/', authenticateToken, getAllPosts)
router.post('/:postId/like', authenticateToken, likePost)
router.delete('/:postId/like', authenticateToken, unlikePost)
router.post('/:postId/comments', authenticateToken, addComment)
router.get('/:postId/comments', authenticateToken, getPostComments)

export default router