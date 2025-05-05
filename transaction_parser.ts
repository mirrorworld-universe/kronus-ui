import { formatDistanceToNow } from "date-fns";
import transactions from "./squads_vault_transactions.json";

export interface KronusTransaction {
  transactionPda: string;
  transaction: Transaction;
  proposalPda: string;
  proposal: Proposal;
  index: string;
}

export interface Transaction {
  multisig: string;
  creator: string;
  index: string;
  bump: number;
  vaultIndex: number;
  vaultBump: number;
  ephemeralSignerBumps: EphemeralSignerBumps;
  message: Message;
}

export type EphemeralSignerBumps = any;

export interface Message {
  numSigners: number;
  numWritableSigners: number;
  numWritableNonSigners: number;
  accountKeys: string[];
  instructions: Instruction[];
  addressTableLookups: any[];
}

export interface Instruction {
  programIdIndex: number;
  accountIndexes: AccountIndexes;
  data: Data;
}

export interface AccountIndexes {
  0: number;
  1?: number;
  2?: number;
  3?: number;
  4?: number;
  5?: number;
  6?: number;
  7?: number;
  8?: number;
  9?: number;
  10?: number;
}

export interface Data {
  0?: number;
  1?: number;
  2?: number;
  3?: number;
  4?: number;
  5?: number;
  6?: number;
  7?: number;
  8?: number;
  9?: number;
  10?: number;
  11?: number;
  12?: number;
  13?: number;
  14?: number;
  15?: number;
}

export interface Proposal {
  multisig: string;
  transactionIndex: string;
  status: Status;
  bump: number;
  approved: string[];
  rejected: any[];
  cancelled: any[];
}

export interface Status {
  __kind: string;
  timestamp: string;
}

type ParsedTransaction = {
  transactionPda: string;
  metadata: {
    type: "Send" | "Receive" | "Arbitrary" | "Unknown";
    transferType?: "VaultToVault" | "VaultToExternal" | "ExternalToVault" | "ExternalToExternal";
    from?: string;
    to?: string;
    assetType?: "SOL" | "SPL";
    mint?: string;
    amount?: bigint;
    image?: string;
    tokenProgram?: "Token" | "Token-2022";
  };
  createdBy: string;
  multisigAccount: string;
  createdAt: string;
  executedAt?: string;
  createdAgo: string;
  executedAgo?: string;
  transactionLink: string;
  status: string;
  approvals: number;
  rejections: number;
  votes: {
    approved: string[];
    rejected: string[];
    cancelled: string[];
  };
};

export function classifyAndExtractTransaction(
  tx: KronusTransaction,
  vaults: Set<string>
): ParsedTransaction {
  const message = tx.transaction.message;
  const keys = message.accountKeys;
  const instructions = message.instructions;

  const status = tx.proposal.status.__kind;
  const approvals = tx.proposal.approved.length;
  const rejections = tx.proposal.rejected.length;

  const timestamp = parseInt(tx.proposal.status.timestamp, 16) * 1000;
  const date = new Date(timestamp);
  const iso = date.toISOString();

  const createdAt = iso;
  const createdAgo = formatDistanceToNow(date, { addSuffix: true });

  const executedAt = status === "Executed" ? iso : undefined;
  const executedAgo = status === "Executed" ? formatDistanceToNow(date, { addSuffix: true }) : undefined;

  const link = `https://explorer.solana.com/tx/${tx.transactionPda}`;

  let metadata: ParsedTransaction["metadata"] = { type: "Unknown" };

  // Check if this is a transfer transaction
  const isTransfer = instructions.some((ix) => {
    const programId = keys[ix.programIdIndex]!;
    return programId === "11111111111111111111111111111111" // System Program
      || programId === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" // Token Program
      || programId === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" // Token-2022 Program
      || programId === "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"; // Associated Token Program
  });

  if (!isTransfer) {
    metadata = { type: "Arbitrary" };
  } else {
    for (const ix of instructions) {
      const programId = keys[ix.programIdIndex]!;
      const accountIndices = Object.values(ix.accountIndexes);
      const accounts = accountIndices.map(i => keys[i]);

      // Handle System Program transfers (SOL)
      if (programId === "11111111111111111111111111111111") {
        const sender = accounts[0]!;
        const recipient = accounts[1]!;

        metadata = {
          type: "Send",
          transferType: vaults.has(sender)
            ? (vaults.has(recipient) ? "VaultToVault" : "VaultToExternal")
            : (vaults.has(recipient) ? "ExternalToVault" : "ExternalToExternal"),
          from: sender,
          to: recipient,
          assetType: "SOL"
        };
        break;
      }

      // Handle Token Program transfers (SPL)
      const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

      if (programId === TOKEN_PROGRAM_ID || programId === TOKEN_2022_PROGRAM_ID) {
        // For SPL transfers, the accounts are typically:
        // [0] = source token account (ATA or token account)
        // [1] = destination token account (ATA or token account)
        // [2] = authority/owner
        // [3] = mint (for both legacy and token-2022)
        // [4+] = additional accounts (sysvar, program ids, etc)
        const destTokenAccount = accounts[1]!;
        const authority = accounts[2]!;

        // The mint is the same position (4th account) for both Token and Token-2022
        let mint = accounts[3];

        // If we can't find the mint in the standard position, try to find it in other accounts
        if (!mint) {
          // Look for the mint in remaining accounts
          const remainingAccounts = accounts.slice(4);
          // The mint is usually the first non-program ID account in the remaining accounts
          mint = remainingAccounts.find(acc =>
            acc
            && acc !== TOKEN_PROGRAM_ID
            && acc !== TOKEN_2022_PROGRAM_ID
            && !acc.includes("11111111") // Skip System Program
          );
        }

        // If we still can't find the mint, try to find it in the instruction data
        if (!mint) {
          const data = Object.values(ix.data ?? {});
          if (data.length > 0) {
            // Look for references to accounts that might be the mint
            const mintIndex = data.findIndex((_, i) => {
              const acc = accounts[i];
              return acc
                && acc !== TOKEN_PROGRAM_ID
                && acc !== TOKEN_2022_PROGRAM_ID
                && !acc.includes("11111111");
            });
            if (mintIndex !== -1) {
              mint = accounts[mintIndex];
            }
          }
        }

        // Try to find the owner of the token accounts
        const sourceOwner = authority;

        // The destination owner might be explicit in the accounts list
        // or we might need to derive it from the destination token account
        let destOwner = accounts[4];
        if (!destOwner) {
          destOwner = destTokenAccount;
        }

        // Determine if this is a Token-2022 transfer
        const isToken2022 = programId === TOKEN_2022_PROGRAM_ID;

        metadata = {
          type: "Send",
          transferType: vaults.has(sourceOwner)
            ? (vaults.has(destOwner) ? "VaultToVault" : "VaultToExternal")
            : (vaults.has(destOwner) ? "ExternalToVault" : "ExternalToExternal"),
          from: sourceOwner,
          to: destOwner,
          assetType: "SPL",
          mint,
          amount: ix.data
            ? Object.values(ix.data).slice(1, 9).reduceRight(
                (acc, b, i) => acc + BigInt(b) * (1n << (8n * BigInt(8 - 1 - i))),
                0n
              )
            : undefined,
          image: mint ? `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png` : undefined,
          tokenProgram: isToken2022 ? "Token-2022" : "Token"
        };
        break;
      }
    }
  }

  return {
    transactionPda: tx.transactionPda,
    metadata,
    createdBy: tx.transaction.creator,
    multisigAccount: tx.transaction.multisig,
    createdAt,
    executedAt,
    createdAgo,
    executedAgo,
    transactionLink: link,
    status,
    approvals,
    rejections,
    votes: {
      approved: tx.proposal.approved,
      rejected: tx.proposal.rejected,
      cancelled: tx.proposal.cancelled
    }
  };
}

const vaults = new Set([
  "5w6aPNkWshCuBqdqXYjq1cQTa6GxPJGYoB3jRa3LABmW",
  "GbecnmRcuKWQhbh925WWyRYWemDGtNyJNUE8EPPSwHWg",
]);

const results = transactions.map(tx => classifyAndExtractTransaction(tx, vaults));
console.log(results);
