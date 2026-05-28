import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET POSTS (WITH AUTHOR + COMMENTS)
 */
router.get("/", async (_req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        comments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

/**
 * CREATE POST
 */
router.post("/", async (req, res) => {
  try {
    const { title, content, authorId } = req.body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        likesCount: 0,
        authorId: authorId || null,
      },
      include: {
        author: true,
        comments: true,
      },
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

/**
 * LIKE POST + CREATE NOTIFICATION
 */
router.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.update({
      where: { id },
      data: {
        likesCount: {
          increment: 1,
        },
      },
      include: {
        author: true,
      },
    });

    // 🔔 CREATE NOTIFICATION FOR POST OWNER
    if (post.authorId) {
      await prisma.notification.create({
        data: {
          type: "LIKE",
          message: `${post.author?.name || "Someone"} liked your post`,
          userId: post.authorId,
        },
      });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
});

/**
 * ADD COMMENT + NOTIFICATION
 */
router.post("/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
      },
    });

    // 🔔 NOTIFICATION FOR POST OWNER
    if (post?.authorId) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          message: `Someone commented on your post`,
          userId: post.authorId,
        },
      });
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: "Comment failed" });
  }
});

export default router;