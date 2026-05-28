import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET all waitlist users
router.get("/", async (_req, res) => {
  try {
    const users = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch waitlist" });
  }
});

// CREATE new waitlist user
router.post("/", async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await prisma.waitlistEntry.create({
      data: {
        name,
        email,
        studentType: "INTERNATIONAL",
        yearOfStudy: "1",
        interestsJson: "AI,Networking",
      },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

export default router;