import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import logger from "../utils/logger";
import { DatabaseError } from "../utils/errors";

class Database {
  private static instance: PrismaClient;
  private static pool: Pool;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      // Create PostgreSQL connection pool
      Database.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      // Create Prisma adapter
      const adapter = new PrismaPg(Database.pool);

      // Initialize Prisma Client with adapter
      Database.instance = new PrismaClient({
        adapter,
        log: [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === "development") {
        Database.instance.$on("query" as never, (e: any) => {
          logger.debug(`Query: ${e.query}`);
          logger.debug(`Duration: ${e.duration}ms`);
        });
      }

      Database.instance.$on("error" as never, (e: any) => {
        logger.error("Prisma Error:", e);
      });

      Database.instance.$on("warn" as never, (e: any) => {
        logger.warn("Prisma Warning:", e);
      });
    }

    return Database.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = Database.getInstance();
      await prisma.$connect();
      logger.info("✅ Database connected successfully");
    } catch (error) {
      logger.error("❌ Database connection failed:", error);
      throw new DatabaseError("Failed to connect to database");
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = Database.getInstance();
      await prisma.$disconnect();

      // Close the connection pool
      if (Database.pool) {
        await Database.pool.end();
      }

      logger.info("Database disconnected");
    } catch (error) {
      logger.error("Error disconnecting from database:", error);
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = Database.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error("Database health check failed:", error);
      return false;
    }
  }
}

export default Database;
