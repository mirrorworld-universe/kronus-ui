import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Contacts table for address book
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull().unique(),
  description: text("description"),
  tags: text("tags"), // JSON array stored as TEXT
  createdAt: text("created_at").default(sql`datetime('now')`),
  updatedAt: text("updated_at").default(sql`datetime('now')`),
});

// Multisig groups table
export const multisigs = sqliteTable("multisigs", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull().unique(),
  name: text("name").notNull(),
  threshold: integer("threshold").notNull(),
  createdAt: text("created_at").default(sql`datetime('now')`),
  updatedAt: text("updated_at").default(sql`datetime('now')`),
});

// Multisig members table (many-to-many) for historical tracking
export const multisigMembers = sqliteTable("multisig_members", {
  multisigId: text("multisig_id").notNull().references(() => multisigs.id),
  publicKey: text("public_key").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  role: text("role"),
  createdAt: text("created_at").default(sql`datetime('now')`),
}, table => ({
  pk: primaryKey({ columns: [table.multisigId, table.publicKey] }),
}));

// Vaults table
export const vaults = sqliteTable("vaults", {
  multisigId: text("multisig_id").notNull().references(() => multisigs.id),
  vaultIndex: integer("vault_index").notNull(),
  createdAt: text("created_at").default(sql`datetime('now')`),
}, table => ({
  pk: primaryKey({ columns: [table.multisigId, table.vaultIndex] }),
}));

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  multisigId: text("multisig_id").notNull().references(() => multisigs.id),
  proposer: text("proposer").notNull(),
  instructions: text("instructions"), // JSON stored as TEXT
  status: text("status", { enum: ["pending", "approved", "executed", "rejected"] }).notNull(),
  createdAt: text("created_at").default(sql`datetime('now')`),
  updatedAt: text("updated_at").default(sql`datetime('now')`),
});

// Transaction signatures table
export const transactionSignatures = sqliteTable("transaction_signatures", {
  transactionId: text("transaction_id").notNull().references(() => transactions.id),
  publicKey: text("public_key").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  timestamp: text("timestamp").default(sql`datetime('now')`),
}, table => ({
  pk: primaryKey({ columns: [table.transactionId, table.publicKey] }),
}));
