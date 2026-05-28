import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * FOLLOW USER
 */
router.post("/:id/follow", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: id,
      },
    });

    res.json(follow);
  } catch (err) {
    res.status(500).json({ error: "Follow failed" });
  }
});

/**
 * UNFOLLOW USER
 */
router.post("/:id/unfollow", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: id,
      },
    });

    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ error: "Unfollow failed" });
  }
});

/**
 * GET FOLLOW INFO
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const followers = await prisma.follow.count({
      where: { followingId: id },
    });

    const following = await prisma.follow.count({
      where: { followerId: id },
    });

    res.json({ followers, following });
  } catch (err) {
    res.status(500).json({ error: "Failed to get follow data" });
  }
});

export default router;