import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

// We manually call dotenv.config() to ensure
// process.env.DATABASE_URL is available to the CLI
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
