import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

// Contacts table for address book
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull().unique(),
  description: text("description"),
  tags: text("tags"), // JSON array stored as TEXT
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Multisig groups table
export const multisigs = pgTable("multisigs", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull().unique(),
  name: text("name").notNull(),
  threshold: integer("threshold").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Multisig members table
export const multisigMembers = pgTable("multisig_members", {
  multisigId: text("multisig_id").notNull().references(() => multisigs.id),
  publicKey: text("public_key").notNull(),
}, table => ({
  pk: primaryKey({ columns: [table.multisigId, table.publicKey] }),
}));

// Vaults table
export const vaults = pgTable("vaults", {
  multisigId: text("multisig_id").notNull().references(() => multisigs.id),
  vaultIndex: integer("vault_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, table => ({
  pk: primaryKey({ columns: [table.multisigId, table.vaultIndex] }),
}));

// Transactions table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  multisigId: text("multisig_id").notNull().references(() => multisigs.id),
  vaultIndex: integer("vault_index").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction signatures table
export const transactionSignatures = pgTable("transaction_signatures", {
  transactionId: text("transaction_id").notNull().references(() => transactions.id),
  publicKey: text("public_key").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  timestamp: timestamp("timestamp").defaultNow(),
}, table => ({
  pk: primaryKey({ columns: [table.transactionId, table.publicKey] }),
}));
