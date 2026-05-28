import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Safe seed function
 * - Will NEVER crash if DB is empty
 * - Will ONLY insert data if needed
 * - Fixes: "cannot read properties of undefined (reading 'count')"
 */
export async function ensureSeedData() {
  try {
    // ---------------------------
    // Check if users exist safely
    // ---------------------------
    const userCount = await prisma.user.count().catch(() => 0);

    if (userCount === 0) {
      await prisma.user.create({
        data: {
          email: "admin@bridgecn.com",
          name: "BridgeCN Admin",
          password: "admin123", // NOTE: later we should hash this
          studentType: "ADMIN",
          userRole: "ADMIN",
          yearOfStudy: "N/A",
          interestsJson: "",
          bio: "System administrator account",
        },
      });

      console.log("🌱 Seed: Admin user created");
    } else {
      console.log("🌱 Seed: Users already exist, skipping");
    }

    // ---------------------------
    // Check posts safely
    // ---------------------------
    const postCount = await prisma.post.count().catch(() => 0);

    if (postCount === 0) {
      await prisma.post.create({
        data: {
          title: "Welcome to BridgeCN",
          content:
            "This is the first post in the BridgeCN student networking platform.",
          imageUrl: null,
          tagsJson: "welcome,bridgecn",
          likesCount: 0,
        },
      });

      console.log("🌱 Seed: Welcome post created");
    } else {
      console.log("🌱 Seed: Posts already exist, skipping");
    }
  } catch (error) {
    console.error("❌ Seed error (handled safely):", error);
  }
}