// ledger-transaction-utils.ts
import { createHash } from "crypto";
import type {
  Transaction } from "@solana/web3.js/lib/index.esm";
import {
  VersionedTransaction,
} from "@solana/web3.js/lib/index.esm";

/**
 * Utility functions for handling Ledger transaction message hashes during blind signing
 */
export const LedgerTransactionUtils = {
  /**
   * Get the transaction message hash that will be displayed on Ledger during blind signing
   *
   * @param transaction Transaction or VersionedTransaction to get the hash for
   * @returns The SHA256 hash as a hex string
   */
  getTransactionMessageHash(
    transaction: Transaction | VersionedTransaction
  ): string {
    // Get the serialized message from the transaction
    const serializedMessage = LedgerTransactionUtils.getSerializedMessage(transaction);

    // Hash the serialized message with SHA256
    const hash = createHash("sha256").update(serializedMessage).digest("hex");

    return hash;
  },

  /**
   * Get the serialized message from a transaction
   * Works with both legacy and versioned transactions
   *
   * @param transaction Transaction or VersionedTransaction to get serialized message from
   * @returns Serialized message as a Buffer
   */
  getSerializedMessage(
    transaction: Transaction | VersionedTransaction
  ): Buffer {
    if (transaction instanceof VersionedTransaction) {
      return Buffer.from(transaction.message.serialize());
    } else {
      // For legacy transactions, serialize the message
      return transaction.compileMessage().serialize();
    }
  },
};
