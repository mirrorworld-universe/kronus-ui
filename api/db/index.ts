import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Get database URL from environment variable
const connectionString = process.env.NUXT_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const pool = new Pool({
  connectionString: process.env.NUXT_DATABASE_URL,
});
export const db = drizzle(pool, {
  logger: true
});
