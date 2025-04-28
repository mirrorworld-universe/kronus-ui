import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./server/db/migrations",
  schema: "./server/db/schema.ts",
  // driver: "pg",
  dbCredentials: {
    url: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  }
});
