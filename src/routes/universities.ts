import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { stripSensitive } from '../utils/sanitize';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const universities = await prisma.university.findMany({
    orderBy: { studentsCount: 'desc' },
    include: {
      students: {
        take: 4,
        orderBy: { createdAt: 'desc' }
      },
      events: {
        take: 3,
        orderBy: { dateTime: 'asc' }
      }
    }
  });

  res.json({ universities: stripSensitive(universities) });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const university = await prisma.university.findUnique({
    where: { slug: req.params.slug },
    include: {
      students: {
        orderBy: { createdAt: 'desc' },
        take: 8
      },
      events: {
        orderBy: { dateTime: 'asc' },
        take: 6
      }
    }
  });

  if (!university) {
    return res.status(404).json({ message: 'University not found' });
  }

  res.json({ university: stripSensitive(university) });
}));

export default router;
