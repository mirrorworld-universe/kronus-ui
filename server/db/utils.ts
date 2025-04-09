import { sqliteTable } from "drizzle-orm/sqlite-core";

export function createTable(name: string, columns: any, constraints?: any) {
  return sqliteTable(name, columns, constraints);
}
