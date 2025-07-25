import {
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
  createKey: text("create_key").notNull().unique(),
  firstVault: text("first_vault").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  threshold: integer("threshold").notNull(),
  creator: text("creator").notNull(), // Public key of the creator
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Multisig members table
export const multisigMembers = pgTable(
  "multisig_members",
  {
    multisigId: text("multisig_id")
      .notNull()
      .references(() => multisigs.id),
    publicKey: text("public_key").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.multisigId, table.publicKey] }),
  })
);

// Vaults table
export const vaults = pgTable(
  "vaults",
  {
    multisigId: text("multisig_id")
      .notNull()
      .references(() => multisigs.id),
    vaultIndex: integer("vault_index").notNull(),
    name: text("name").notNull(),
    publicKey: text("public_key").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.multisigId, table.vaultIndex] }),
  })
);

// Transactions table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  transactionPda: text("transaction_pda").notNull(),
  multisigId: text("multisig_id")
    .notNull()
    .references(() => multisigs.id),
  vaultIndex: integer("vault_index").notNull(),
  vaultAccount: text("vault_account").notNull(),
  metadata: json().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction signatures table
export const transactionSignatures = pgTable(
  "transaction_signatures",
  {
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id),
    publicKey: text("public_key").notNull(),
    metadata: json().notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.transactionId, table.publicKey] }),
  })
);

// Testnet Contacts table for address book
export const testnetContacts = pgTable("testnet_contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull().unique(),
  description: text("description"),
  tags: text("tags"), // JSON array stored as TEXT
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testnet Multisig groups table
export const testnetMultisigs = pgTable("testnet_multisigs", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull().unique(),
  createKey: text("create_key").notNull().unique(),
  firstVault: text("first_vault").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  threshold: integer("threshold").notNull(),
  creator: text("creator").notNull(), // Public key of the creator
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testnet Multisig members table
export const testnetMultisigMembers = pgTable(
  "testnet_multisig_members",
  {
    multisigId: text("multisig_id")
      .notNull()
      .references(() => testnetMultisigs.id),
    publicKey: text("public_key").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.multisigId, table.publicKey] }),
  })
);

// Testnet Vaults table
export const testnetVaults = pgTable(
  "testnet_vaults",
  {
    multisigId: text("multisig_id")
      .notNull()
      .references(() => testnetMultisigs.id),
    vaultIndex: integer("vault_index").notNull(),
    name: text("name").notNull(),
    publicKey: text("public_key").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.multisigId, table.vaultIndex] }),
  })
);

// Testnet Transactions table
export const testnetTransactions = pgTable("testnet_transactions", {
  id: text("id").primaryKey(),
  transactionPda: text("transaction_pda").notNull(),
  multisigId: text("multisig_id")
    .notNull()
    .references(() => testnetMultisigs.id),
  vaultIndex: integer("vault_index").notNull(),
  vaultAccount: text("vault_account").notNull(),
  metadata: json().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testnet Transaction signatures table
export const testnetTransactionSignatures = pgTable(
  "testnet_transaction_signatures",
  {
    transactionId: text("transaction_id")
      .notNull()
      .references(() => testnetTransactions.id),
    publicKey: text("public_key").notNull(),
    metadata: json().notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.transactionId, table.publicKey] }),
  })
);
