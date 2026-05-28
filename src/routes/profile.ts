import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authRequired } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { stripSensitive } from '../utils/sanitize';

const router = Router();

router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      university: true,
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  });

  res.json({ user: stripSensitive(user) });
}));

export default router;
