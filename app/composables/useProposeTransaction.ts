import {
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import type { z } from "zod";
import type { createTransactionSchema } from "~~/server/validations/schemas";

export type CreateTransactionMetadata = z.infer<typeof createTransactionSchema>["metadata"];

export async function createSquadsVaultTransaction(
  tx: Transaction,
  multisigAddress: string,
  vaultIndex: number,
  creator: PublicKey,
  wallet: WalletStore,
  metadata?: CreateTransactionMetadata
) {
  const multisigPda = new PublicKey(multisigAddress);
  const connection = connectionManager.getCurrentConnection();

  const [vaultPda] = multisig.getVaultPda({
    multisigPda: multisigPda,
    index: vaultIndex,
  });
  console.log("vaultPda: ", vaultPda.toBase58());

  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda,
  );

  const currentTransactionIndex = Number(multisigInfo.transactionIndex);
  const newTransactionIndex = BigInt(currentTransactionIndex + 1);

  const payerKey = vaultPda;

  console.log("Proposing Transaction To Vault Address", payerKey.toBase58());

  const transactionMessage = new TransactionMessage({
    payerKey: creator,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: tx.instructions,
  });

  const __tx = new VersionedTransaction(transactionMessage.compileToV0Message());
  const serializedTransaction = __tx.serialize();
  const base64Transaction = Buffer.from(serializedTransaction).toString(
    "base64",
  );

  console.log("Base64 Transaction:", base64Transaction);

  const vaultTransactionCreateIx = multisig.instructions.vaultTransactionCreate(
    {
      multisigPda: multisigPda,
      transactionIndex: newTransactionIndex,
      creator,
      vaultIndex: vaultIndex,
      ephemeralSigners: 0,
      transactionMessage: transactionMessage,
      memo: metadata?.description || "",
      programId: SQUADS_V4_PROGRAM_ID,
    },
  );

  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: newTransactionIndex,
    programId: SQUADS_V4_PROGRAM_ID
  });

  const proposalCreateIx = multisig.instructions.proposalCreate({
    multisigPda: multisigPda,
    transactionIndex: BigInt(newTransactionIndex),
    creator: creator,
    isDraft: false,
    programId: SQUADS_V4_PROGRAM_ID
  });

  const approveTransactionProposalInstruction
    = multisig.instructions.proposalApprove({
      multisigPda: multisigPda,
      transactionIndex: BigInt(newTransactionIndex),
      member: creator,
      programId: SQUADS_V4_PROGRAM_ID
    });

  const transaction: Transaction = new Transaction();
  transaction.add(
    vaultTransactionCreateIx,
    proposalCreateIx,
    approveTransactionProposalInstruction,
  );

  transaction.feePayer = creator;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  const signature = await signAndSendTransaction(
    connection,
    wallet,
    [],
    transaction,
  );
  console.log("signature", signature);

  // Store multisig data in D1
  try {
    await $fetch(`/api/vaults/${multisigAddress}/transactions`, {
      method: "POST",
      body: {
        vault_index: vaultIndex,
        transaction_pda: transactionPda.toBase58(),
        vault_account: vaultPda.toBase58(),
        metadata
      }
    });
  } catch (error) {
    console.error("Failed to store multisig data:", error);
  }

  return {
    hash: signature,
  };
}
