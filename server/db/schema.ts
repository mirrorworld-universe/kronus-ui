/* eslint-disable @stylistic/indent */
import { sql } from "drizzle-orm";
import { text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { timestamp, json } from "drizzle-orm/mysql-core";
import { createTable } from "./utils";

// Contacts table for address book
export const contacts = createTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull().unique(),
  description: text("description"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Multisig groups table
export const multisigs = createTable("multisigs", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull().unique(),
  name: text("name").notNull(),
  threshold: integer("threshold").notNull(),
  members: json("members")
    .$type<
      {
        publicKey: string;
        contactId?: string;
        role?: string;
      }[]
    >()
    .notNull(),
  creationMetadata: json("creation_metadata").$type<{
    creator: string;
    timestamp: number;
    version: string;
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Multisig members table (many-to-many) for historical tracking
export const multisigMembers = createTable(
  "multisig_members",
  {
    multisigId: text("multisig_id")
      .notNull()
      .references(() => multisigs.id),
    publicKey: text("public_key").notNull(),
    contactId: text("contact_id").references(() => contacts.id),
    role: text("role"),
    action: text("action", { enum: ["add", "remove"] }).notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  // eslint-disable-next-line @stylistic/arrow-parens
  (table) => ({
    pk: primaryKey({
      columns: [table.multisigId, table.publicKey, table.action],
    }),
  })
);

// Transactions table
export const transactions = createTable("transactions", {
  id: text("id").primaryKey(),
  multisigId: text("multisig_id")
    .notNull()
    .references(() => multisigs.id),
  proposer: text("proposer").notNull(),
  instructions: json("instructions").notNull(),
  status: text("status", {
    enum: ["pending", "approved", "executed", "rejected"],
  }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Transaction signatures table
export const transactionSignatures = createTable(
  "transaction_signatures",
  {
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id),
    publicKey: text("public_key").notNull(),
    contactId: text("contact_id").references(() => contacts.id),
    timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
  },
  // eslint-disable-next-line @stylistic/arrow-parens
  (table) => ({
    pk: primaryKey({ columns: [table.transactionId, table.publicKey] }),
  })
);
