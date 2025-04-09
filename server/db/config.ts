import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
}

export type Context = {
  db: ReturnType<typeof drizzle<typeof schema>>;
};

export function createContext(env: Env): Context {
  const db = drizzle(env.DB, { schema });
  return { db };
}

// Database types
export type Database = ReturnType<typeof drizzle<typeof schema>>;
