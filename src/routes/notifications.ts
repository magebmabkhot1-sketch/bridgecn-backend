import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET USER NOTIFICATIONS
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * MARK AS READ
 */
router.post("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

export default router;