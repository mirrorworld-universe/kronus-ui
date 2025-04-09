import { eq } from "drizzle-orm";
import type { Database } from "../db/config";
import {
  contacts,
  multisigs,
  transactions,
  transactionSignatures,
} from "../db/schema";

export class DatabaseService {
  constructor(private db: Database) {}

  // Contacts
  async createContact(data: typeof contacts.$inferInsert) {
    return this.db.insert(contacts).values(data).returning();
  }

  async getContact(id: string) {
    return this.db.select().from(contacts).where(eq(contacts.id, id));
  }

  async updateContact(id: string, data: Partial<typeof contacts.$inferInsert>) {
    return this.db
      .update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();
  }

  async deleteContact(id: string) {
    return this.db.delete(contacts).where(eq(contacts.id, id));
  }

  // Multisigs
  async createMultisig(data: typeof multisigs.$inferInsert) {
    return this.db.insert(multisigs).values(data).returning();
  }

  async getMultisig(id: string) {
    return this.db.select().from(multisigs).where(eq(multisigs.id, id));
  }

  async getMultisigByPublicKey(publicKey: string) {
    return this.db
      .select()
      .from(multisigs)
      .where(eq(multisigs.publicKey, publicKey));
  }

  async updateMultisig(
    id: string,
    data: Partial<typeof multisigs.$inferInsert>
  ) {
    return this.db
      .update(multisigs)
      .set(data)
      .where(eq(multisigs.id, id))
      .returning();
  }

  async deleteMultisig(id: string) {
    return this.db.delete(multisigs).where(eq(multisigs.id, id));
  }

  // Transactions
  async createTransaction(data: typeof transactions.$inferInsert) {
    return this.db.insert(transactions).values(data).returning();
  }

  async getTransaction(id: string) {
    return this.db.select().from(transactions).where(eq(transactions.id, id));
  }

  async getTransactionsByMultisig(multisigId: string) {
    return this.db
      .select()
      .from(transactions)
      .where(eq(transactions.multisigId, multisigId));
  }

  async updateTransaction(
    id: string,
    data: Partial<typeof transactions.$inferInsert>
  ) {
    return this.db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
  }

  // Transaction Signatures
  async addSignature(data: typeof transactionSignatures.$inferInsert) {
    return this.db.insert(transactionSignatures).values(data).returning();
  }

  async getTransactionSignatures(transactionId: string) {
    return this.db
      .select()
      .from(transactionSignatures)
      .where(eq(transactionSignatures.transactionId, transactionId));
  }

  async getSignaturesByPublicKey(publicKey: string) {
    return this.db
      .select()
      .from(transactionSignatures)
      .where(eq(transactionSignatures.publicKey, publicKey));
  }
}
