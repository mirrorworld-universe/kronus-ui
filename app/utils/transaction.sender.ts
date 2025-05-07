import type {
  Connection,
  Keypair,
  SignatureStatus,

  TransactionInstruction,
} from "@solana/web3.js/lib/index.esm";
import {
  Transaction,
  VersionedTransaction,
  ComputeBudgetProgram,
  VersionedMessage,
  SendTransactionError,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js/lib/index.esm";
import { backOff } from "exponential-backoff";
import type { createWalletStore } from "solana-wallets-vue";

export type WalletStore = ReturnType<typeof createWalletStore>;

const RETRY_INTERVAL_MS = 2000;
const MAX_RETRIES = 30;
const MIN_CU_PRICE = 10_000;
const MAX_CU_PRICE = 10_000_000;

export type TxStatusUpdate = {
  status: "created" | "signed" | "sent" | "confirmed";
  signature?: string;
  result?: SignatureStatus;
};

export class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationError";
  }
}

export async function getComputeUnitsEstimate(
  transaction: Transaction | VersionedTransaction,
  connection: Connection
) {
  const versionedTransaction
    = transaction instanceof VersionedTransaction
      ? transaction
      : new VersionedTransaction(
        VersionedMessage.deserialize(transaction.serializeMessage())
      );

  const result = await connection.simulateTransaction(versionedTransaction, {
    commitment: "confirmed"
  });

  if (result.value.err) {
    console.error(result.value.err);
    const logs = result.value.logs || [];
    const insufficientFunds = logs.find(log =>
      log.toLowerCase().includes("insufficient lamports")
    );
    if (insufficientFunds) {
      // Example error message: Transfer: insufficient lamports 78540160, need 132000000
      const match = insufficientFunds.match(/need (\d+)/);
      const neededLamports = match ? parseInt(match[1]!, 10) : 0;
      const neededSOL = Intl.NumberFormat("en-US", {
        maximumFractionDigits: 6,
      }).format(neededLamports / LAMPORTS_PER_SOL);
      return [
        null,
        new SimulationError(
          "You have insufficient SOL in your account to complete this transaction. You need at least "
          + neededSOL
          + " SOL to complete the transaction."
        ),
      ] as const;
    }
    return [null, new SimulationError("Transaction failed to simulate")] as const;
  } else {
    return [(result.value?.unitsConsumed || 0) * 1.2, null] as const;
  }
}

export async function getTransactionPriorityFeeEstimate(connection: Connection) {
  const medianPriorityFees = await connection.getRecentPrioritizationFees({});
  let medianPriorityFee = medianPriorityFees[0]?.prioritizationFee || 0;

  for (let i = 1; i < medianPriorityFees.length; i++) {
    const fee = medianPriorityFees[i]?.prioritizationFee;
    if (fee && fee > medianPriorityFee) {
      medianPriorityFee = fee;
    }
  }

  return Math.min(Math.max(medianPriorityFee, MIN_CU_PRICE), MAX_CU_PRICE);
}

function prependComputeBudgetInstructions(
  transaction: Transaction,
  computeBudgetInstructions: TransactionInstruction[]
) {
  transaction.instructions = [
    ...computeBudgetInstructions,
    ...transaction.instructions.filter(
      ix => !ix.programId.equals(ComputeBudgetProgram.programId)
    ),
  ];
  return transaction;
}

export async function signAndSendTransaction(
  connection: Connection,
  wallet: WalletStore,
  signers: Keypair[],
  txn: Transaction | VersionedTransaction,
  onStatusUpdate?: (status: TxStatusUpdate) => void
) {
  if (!wallet.signTransaction.value || !wallet.publicKey.value) {
    throw new Error("Wallet is not connected or public key is missing");
  }

  let latestBlockhash: string;
  try {
    latestBlockhash = await backOff(
      async () => (await connection.getLatestBlockhash("confirmed")).blockhash
    );
  } catch (e: any) {
    throw new Error("Unable to get latest blockhash: " + e.message);
  }

  // Estimate compute units
  const [computeUnitsEstimate, error] = await getComputeUnitsEstimate(txn, connection);

  if (error) throw error;

  const priorityFee = await getTransactionPriorityFeeEstimate(connection);

  // Prepend compute budget only if it's a legacy Transaction
  if (txn instanceof Transaction) {
    const computeBudgetIx = [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnitsEstimate,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      }),
    ];

    prependComputeBudgetInstructions(txn, computeBudgetIx);

    txn.feePayer = wallet.publicKey.value;
    txn.recentBlockhash = latestBlockhash;

    // Sign with keypairs
    if (signers.length > 0) {
      txn.sign(...signers);
    }
  } else {
    // VersionedTransaction: cannot modify instructions — log warning
    console.warn(
      "[signAndSendTransaction] Received VersionedTransaction; cannot prepend compute budget instructions."
    );
  }

  onStatusUpdate?.({ status: "created" });

  const signedTx = await wallet.signTransaction.value(txn);
  onStatusUpdate?.({ status: "signed" });

  let retries = 0;
  let signature: string | null = null;
  let status: SignatureStatus | null = null;

  while (retries < MAX_RETRIES) {
    try {
      if (!signature) {
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        });
        onStatusUpdate?.({ status: "sent", signature });
        console.log("Transaction sent:", signature);
      }

      const response = await connection.getSignatureStatus(signature);
      if (response?.value) {
        status = response.value;
        if (status.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }

        if (
          status.confirmationStatus === "confirmed"
          || status.confirmationStatus === "finalized"
        ) {
          onStatusUpdate?.({ status: "confirmed", result: status });
          return signature;
        }
      }
    } catch (e: any) {
      console.error("Error processing transaction:", e);
      if (e instanceof SendTransactionError) throw e;
      if (retries === MAX_RETRIES - 1) throw e;
    }

    retries++;
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
  }

  throw new Error("Transaction timed out");
}
