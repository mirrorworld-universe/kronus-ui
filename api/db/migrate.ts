import { readFileSync } from "fs";
import { resolve } from "path";
import { sql } from "drizzle-orm";
import { getDB } from ".";

export async function migrate() {
  const db = await getDB();
  try {
    // Read the schema file
    const schema = readFileSync(resolve(__dirname, "./schema.sql"), "utf-8");

    // Split into individual statements
    const statements = schema
      .split(";")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await db.run(sql.raw(statement));
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
