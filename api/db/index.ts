/// <reference types="@cloudflare/workers-types" />
import { drizzle } from "drizzle-orm/d1";

declare global {
  // eslint-disable-next-line no-var
  var DB: D1Database | undefined;
}

let db: ReturnType<typeof drizzle>;

export function getDB() {
  if (!db) {
    if (!globalThis.DB) {
      throw new Error("D1 database not found. Make sure you are running with wrangler");
    }
    db = drizzle(globalThis.DB);
  }
  return db;
}
