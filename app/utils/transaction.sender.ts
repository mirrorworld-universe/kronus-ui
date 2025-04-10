import {
  Transaction,
  VersionedMessage,
  VersionedTransaction,
  type Keypair,
  type TransactionInstruction,
  type SignatureStatus,
  type Connection,
  ComputeBudgetProgram } from "@solana/web3.js";
import { backOff } from "exponential-backoff";
// import nacl from "tweetnacl";
import type { createWalletStore } from "solana-wallets-vue";

export type WalletStore = ReturnType<typeof createWalletStore>;

const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId;

/** Gets estimate of compute units consumed by a given transaction */
export async function getComputeUnitsEstimate(
  transaction: Transaction,
  connection: Connection
) {
  const versionedTransactionMessage = VersionedMessage.deserialize(
    // @ts-expect-error typecasting failed
    transaction.serializeMessage()
  );
  const versionedTransaction = new VersionedTransaction(
    versionedTransactionMessage
  );

  const computeUnitsEstimate = await await connection.simulateTransaction(
    versionedTransaction
  );

  return (computeUnitsEstimate.value?.unitsConsumed || 0) * 1.2;
}

// 10k CUs is 0.03 cents, assuming 150k CUs and $250 SOL
const MIN_CU_PRICE = 10_000;
// 10M CUs is $0.38, assuming 150k CUs and $250 SOL
const MAX_CU_PRICE = 10_000_000;

/** Gets a given transaction's priority fee estimate */
export async function getTransactionPriorityFeeEstimate(
  connection: Connection
) {
  const medianPriorityFees = await connection.getRecentPrioritizationFees({});

  // Get largest element in medianPriorityFee array

  // Initialize maximum element
  let medianPriorityFee = medianPriorityFees[0]?.prioritizationFee || 0;

  // Traverse slots
  // from second and compare
  // every slot with current prioritizationFee
  for (let i = 1; i < medianPriorityFees.length; i++) {
    const fee = medianPriorityFees[i]?.prioritizationFee;
    if (fee && fee > medianPriorityFee) {
      medianPriorityFee = fee;
    }
  }

  const priorityFee = Math.min(
    Math.max(medianPriorityFee, MIN_CU_PRICE),
    MAX_CU_PRICE
  );

  return priorityFee;
}

/** Removes any compute budge program instructions if any */
function removeComputeBudgetInstructionsIfAny(transaction: Transaction) {
  // Ensure the transaction has instructions
  if (!transaction.instructions || transaction.instructions.length === 0) {
    return transaction;
  }

  // Filter out Compute Budget instructions
  const filteredInstructions = transaction.instructions.filter(
    instruction => !instruction.programId.equals(COMPUTE_BUDGET_PROGRAM_ID)
  );

  // Create a new transaction with filtered instructions
  const newTransaction = new Transaction();
  newTransaction.recentBlockhash = transaction.recentBlockhash;
  newTransaction.feePayer = transaction.feePayer;
  newTransaction.instructions = filteredInstructions;

  return newTransaction;
}

function prependComputeBudgetInstructions(
  transaction: Transaction,
  computeBudgetInstructions: TransactionInstruction[]
) {
  const newInstructions = [
    ...computeBudgetInstructions,
    ...transaction.instructions,
  ];
  transaction.instructions = newInstructions;
  return transaction;
}

/**
 * ============================
 * Sign and Send Transaction
 * ============================
 * */
// A minute of retries, with 2 second intervals
const RETRY_INTERVAL_MS = 2000;
const MAX_RETRIES = 30;

type TxStatusUpdate =
  | { status: "created" }
  | { status: "signed" }
  | { status: "sent"; signature: string }
  | { status: "confirmed"; result: SignatureStatus };

/** Sign and send a transaction with a priority fee. Assumes that the caller has already set the compute unit limit. */
export async function signAndSendTransaction(
  connection: Connection,
  wallet: WalletStore,
  signers: Keypair[],
  _txn: Transaction,
  onStatusUpdate?: (status: TxStatusUpdate) => void
) {
  if (!wallet.signTransaction.value) {
    throw new Error("Wallet not connected. Unable to sign transactions");
  }

  if (!wallet.publicKey.value) {
    throw new Error("Wallet public key not found");
  }

  let latestBlockhash;
  try {
    latestBlockhash = await backOff(
      async () => (await connection.getLatestBlockhash("confirmed")).blockhash
    );
  } catch (e: any) {
    throw new Error("Unable to get latest blockhash", e.message);
  }

  const unbudgetedTxn = removeComputeBudgetInstructionsIfAny(_txn);
  const priorityFee = await getTransactionPriorityFeeEstimate(connection);
  const computeUnitsEstimate = await getComputeUnitsEstimate(
    unbudgetedTxn,
    connection
  );

  const txn = prependComputeBudgetInstructions(unbudgetedTxn, [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnitsEstimate,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    }),
  ]);

  if (!signers.length) {
    throw new Error("No signers provided");
  }

  // Set fee payer
  txn.feePayer = wallet.publicKey.value;
  txn.recentBlockhash = latestBlockhash;

  onStatusUpdate?.({ status: "created" });

  // First sign with Keypair signers
  for (const signer of signers) {
    txn.sign(signer);
  }

  // Then sign with connected wallet
  const signedTx = await wallet.signTransaction.value(txn);

  onStatusUpdate?.({ status: "signed" });

  let retries = 0;
  let signature: string | null = null;
  let status: SignatureStatus | null = null;

  while (retries < MAX_RETRIES) {
    try {
      if (!signature) {
        signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
            maxRetries: 3,
          }
        );
        onStatusUpdate?.({ status: "sent", signature });
        console.log("Transaction sent:", signature);
      }

      const response = await connection.getSignatureStatus(signature);
      if (response?.value) {
        status = response.value;

        if (status.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }

        if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
          onStatusUpdate?.({ status: "confirmed", result: status });
          return signature;
        }
      }
    } catch (e) {
      console.error("Error processing transaction:", e);
      if (retries === MAX_RETRIES - 1) throw e;
    }

    retries++;
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
  }

  throw new Error("Transaction timed out");
}
