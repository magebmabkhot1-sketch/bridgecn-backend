import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authRequired } from '../middleware/auth';
import { z } from 'zod';
import { stripSensitive } from '../utils/sanitize';

const router = Router();

router.get('/conversations', authRequired, asyncHandler(async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participantAId: req.user!.id },
        { participantBId: req.user!.id }
      ]
    },
    include: {
      participantA: true,
      participantB: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  res.json({ conversations: stripSensitive(conversations) });
}));

router.get('/:conversationId', authRequired, asyncHandler(async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.conversationId },
    include: {
      participantA: true,
      participantB: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: true }
      }
    }
  });

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  res.json({ conversation: stripSensitive(conversation) });
}));

router.post('/:conversationId', authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({ content: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid message' });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: req.params.conversationId,
      senderId: req.user!.id,
      content: parsed.data.content
    },
    include: { sender: true }
  });

  await prisma.conversation.update({
    where: { id: req.params.conversationId },
    data: { updatedAt: new Date() }
  });

  res.status(201).json({ message: stripSensitive(message) });
}));

export default router;
