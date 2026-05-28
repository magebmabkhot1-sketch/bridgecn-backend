import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authRequired } from '../middleware/auth';
import { stripSensitive } from '../utils/sanitize';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const universityId = req.query.universityId as string | undefined;
  const yearOfStudy = req.query.yearOfStudy as string | undefined;
  const interest = (req.query.interest as string | undefined)?.toLowerCase();
  const language = req.query.language as string | undefined;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(20, Math.max(4, Number(req.query.limit || 8)));

  const allStudents = await prisma.user.findMany({
    include: { university: true },
    orderBy: { createdAt: 'desc' }
  });

  const filtered = allStudents.filter((student) => {
    const interests = Array.isArray(student.interestsJson) ? student.interestsJson.map((x: any) => String(x).toLowerCase()) : [];
    return (
      (!universityId || student.universityId === universityId) &&
      (!yearOfStudy || student.yearOfStudy === yearOfStudy) &&
      (!language || student.language === language) &&
      (!interest || interests.some((item) => item.includes(interest)))
    );
  });

  const total = filtered.length;
  const students = filtered.slice((page - 1) * limit, page * limit);

  res.json({ students: stripSensitive(students), total, page, pages: Math.ceil(total / limit) || 1 });
}));

router.post('/:id/connect', authRequired, asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const [a, b] = [req.user!.id, targetId].sort();

  const conversation = await prisma.conversation.upsert({
    where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
    update: {},
    create: { participantAId: a, participantBId: b }
  });

  res.json({ conversation });
}));

export default router;
