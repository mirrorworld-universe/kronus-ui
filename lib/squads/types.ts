import { PublicKey, Transaction } from "@solana/web3.js";

export interface SquadsConfig {
  rpcUrl: string;
  wsUrl?: string;
  appName?: string;
}

export interface MultisigMember {
  address: PublicKey;
  permissions: string[];
  weight?: number;
}

export interface MultisigCreateParams {
  threshold: number;
  members: MultisigMember[];
  timelock?: number;
  name?: string;
  description?: string;
}

export interface MultisigInfo {
  address: PublicKey;
  threshold: number;
  members: MultisigMember[];
  createTime: number;
  transactionCount: number;
  name?: string;
  description?: string;
}

export interface ProposalCreateParams {
  multisigAddress: PublicKey;
  transaction: Transaction;
  title: string;
  description?: string;
}

export interface ProposalInfo {
  address: PublicKey;
  multisigAddress: PublicKey;
  creator: PublicKey;
  transaction: Transaction;
  status: "Draft" | "Active" | "Executed" | "Rejected" | "Cancelled";
  approvals: PublicKey[];
  rejections: PublicKey[];
  createdAt: number;
  executedAt?: number;
  title: string;
  description?: string;
}
