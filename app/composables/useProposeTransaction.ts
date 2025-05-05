import {
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import type { z } from "zod";
import { h } from "vue";
import type { createTransactionSchema } from "~~/server/validations/schemas";
import { UIcon } from "#components";

export type CreateTransactionMetadata = z.infer<typeof createTransactionSchema>["metadata"];

export async function createSquadsVaultTransaction(
  tx: Transaction,
  multisigAddress: string,
  vaultIndex: number,
  creator: PublicKey,
  wallet: WalletStore,
  toast: ReturnType<typeof useToast>,
  metadata?: CreateTransactionMetadata,
) {
  const multisigPda = new PublicKey(multisigAddress);
  const connection = connectionManager.getCurrentConnection();

  const TOASTS: string[] = [];

  function addToToasts(toastId: string | number, message: string) {
    TOASTS.push(message);
    toast.update(toastId, {
      color: "neutral",
      description: () => h("div", {
        class: "flex flex-col gap-2",
      }, [
        TOASTS.map((text, index) => {
          const isLastToast = index + 1 >= TOASTS.length;
          return h("div", { class: "flex gap-2 items-center justify-start text-base text-(--ui-text-highlighted)" }, [
            h(UIcon, { name: isLastToast ? "svg-spinners:bars-rotate-fade" : "material-symbols:check-rounded", color: isLastToast ? "neutral" : "success" }),
            h("span", { class: "text-sm" }, text)
          ]);
        })
      ]),
    });
  }

  function finishAll(toastId: string | number, signature: string) {
    toast.update(toastId, {
      color: "success",
      description: () => h("div", {
        class: "flex flex-col gap-1",
      }, [
        TOASTS.map((text) => {
          return h("div", { class: "flex gap-2 items-center justify-start" }, [
            h(UIcon, { name: "material-symbols:check-rounded" }),
            h("span", { class: "text-sm" }, text)
          ]);
        })
      ]),
      actions: [{
        icon: "i-lucide-link",
        label: "View",
        color: "success",
        variant: "soft",
        onClick: (e) => {
          e?.stopPropagation();
          window.open(`https://explorer.sonic.game/tx/${signature}`);
        }
      }]
    });
  }

  const [vaultPda] = multisig.getVaultPda({
    multisigPda: multisigPda,
    index: vaultIndex,
    programId: SQUADS_V4_PROGRAM_ID
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

  TOASTS.push("Proposing Transaction");

  const t = toast.add({
    close: false,
    color: "neutral",
    duration: Infinity,
    description: () => h("div", {
      class: "flex flex-col gap-1",
    }, [
      h("div", { class: "flex gap-2 items-center justify-start" }, [
        h(UIcon, { name: "svg-spinners:bars-rotate-fade" }),
        h("span", { class: "text-sm" }, "Proposing Transaction")
      ])
    ]
    ),
  });

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
    ({ status }) => {
      console.log("status", status);
      if (status === "created") {
        addToToasts(t.id, "Pending signature");
      } else if (status === "signed") {
        addToToasts(t.id, "Signed. Sending transaction ...");
      } else if (status === "sent") {
        addToToasts(t.id, "Confirming...");
      } else if (status === "confirmed") {
        addToToasts(t.id, "Done!");
      }
    }
  );

  finishAll(t.id, signature);

  setTimeout(() => {
    toast.remove(t.id);
  }, 3000);

  console.log("signature", signature);

  // Store multisig data in D1
  try {
    const transaction = await $fetch(`/api/vaults/${multisigAddress}/transactions`, {
      method: "POST",
      body: {
        vault_index: vaultIndex,
        transaction_pda: transactionPda.toBase58(),
        vault_account: vaultPda.toBase58(),
        metadata
      }
    });

    return {
      signature,
      transaction
    };
  } catch (error) {
    console.error("Failed to store transaction metadata data:", error);
    toast.remove(t.id);
  }
}
