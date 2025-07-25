import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./server/db/migrations",
  schema: "./server/db/schema.ts",
  // driver: "pg",
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL!,
  }
});
