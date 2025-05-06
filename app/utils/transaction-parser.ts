import { formatDistanceToNow } from "date-fns";

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
  tx: any,
): ParsedTransaction {
  const status = tx.proposal!.status.__kind;
  const approvals = tx.proposal!.approved.length;
  const rejections = tx.proposal!.rejected.length;
  const timestamp = parseInt(tx.proposal!.status.timestamp.toNumber()) * 1000;

  const date = new Date(timestamp);
  const iso = date.toISOString();

  const createdAt = iso;
  const createdAgo = formatDistanceToNow(date, { addSuffix: true });

  const executedAt = status === "Executed" ? iso : undefined;
  const executedAgo = status === "Executed" ? formatDistanceToNow(date, { addSuffix: true }) : undefined;

  const link = `https://explorer.sonic.game/tx/${tx.transactionPda}`;

  return {
    transactionPda: tx.transactionPda,
    createdBy: tx.transaction!.creator.toBase58(),
    multisigAccount: tx.transaction!.multisig.toBase58(),
    createdAt,
    executedAt,
    createdAgo,
    executedAgo,
    transactionLink: link,
    status,
    approvals,
    rejections,
    votes: {
      approved: tx.proposal!.approved.map((key: any) => key.toBase58()),
      rejected: tx.proposal!.rejected.map((key: any) => key.toBase58()),
      cancelled: tx.proposal!.cancelled.map((key: any) => key.toBase58())
    }
  };
}
