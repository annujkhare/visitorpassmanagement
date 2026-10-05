import dotenv from "dotenv";
import {
  connectDatabase,
  seedDatabase,
  closeDatabase,
} from "../src/server/db.js";

dotenv.config();

async function resetAndSeed() {
  const forceReset =
    process.argv.includes("--force") || process.env.SEED_RESET === "YES";

  if (!forceReset) {
    console.error(
      "Seed reset blocked. Set SEED_RESET=YES before running this command.",
    );
    process.exit(1);
  }

  try {
    console.log("[Seed] Connecting to MongoDB...");

    const db = await connectDatabase();

    console.log("[Seed] Dropping database: visitor_pass_management");

    await db.dropDatabase();

    console.log("[Seed] Database cleared.");

    console.log("[Seed] Starting fresh seed...");

    await seedDatabase();

    console.log("[Seed] Demo data seeded successfully.");
  } catch (error) {
    console.error("[Seed] Failed:", error);
    process.exitCode = 1;
  } finally {
    try {
      await closeDatabase();
    } catch (error) {
      console.error("[Seed] Database close error:", error);
    }
  }
}

resetAndSeed();
