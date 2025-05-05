import { formatDistanceToNow } from "date-fns";

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
): ParsedTransaction {
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

  const link = `https://explorer.sonic.game/tx/${tx.transactionPda}`;

  return {
    transactionPda: tx.transactionPda,
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
