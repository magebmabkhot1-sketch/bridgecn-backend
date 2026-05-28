import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authRequired } from '../middleware/auth';
import { z } from 'zod';
import { stripSensitive } from '../utils/sanitize';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const events = await prisma.event.findMany({
    include: {
      university: true,
      organizer: true,
      rsvps: true
    },
    orderBy: { dateTime: 'asc' }
  });

  res.json({ events: stripSensitive(events) });
}));

router.post('/', authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    dateTime: z.string().datetime(),
    location: z.string().min(3),
    universityId: z.string().optional().nullable()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid event data' });
  }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      dateTime: new Date(parsed.data.dateTime),
      organizerId: req.user!.id
    }
  });

  res.status(201).json({ event: stripSensitive(event) });
}));

router.post('/:id/rsvp', authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.enum(['GOING', 'INTERESTED', 'NOT_GOING'])
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid RSVP status' });
  }

  const rsvp = await prisma.rsvp.upsert({
    where: {
      eventId_userId: {
        eventId: req.params.id,
        userId: req.user!.id
      }
    },
    update: { status: parsed.data.status },
    create: {
      eventId: req.params.id,
      userId: req.user!.id,
      status: parsed.data.status
    }
  });

  res.json({ rsvp });
}));

export default router;
