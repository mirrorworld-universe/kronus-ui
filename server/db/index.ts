/// <reference types="@cloudflare/workers-types" />
import { drizzle } from "drizzle-orm/d1";

// Assert DB environment variable as D1Database
const db_instance = process.env.DB as unknown as D1Database;

export const db = drizzle(db_instance);
