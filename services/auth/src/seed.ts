import Database from "./config/database";
import logger from "./utils/logger";

/**
 * Seed initial data for development/testing
 */
async function seed() {
  // Uncomment when needed
  // const prisma = Database.getInstance();

  try {
    logger.info("Starting database seed...");

    // Add any seed data here
    // Example: Create admin user

    logger.info("✅ Database seeded successfully");
  } catch (error) {
    logger.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await Database.disconnect();
  }
}

seed().catch((error) => {
  logger.error("Fatal error during seed:", error);
  process.exit(1);
});
