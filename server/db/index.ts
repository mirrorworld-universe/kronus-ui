import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.NUXT_DATABASE_URL,
});

export const db = drizzle(pool, { schema });
