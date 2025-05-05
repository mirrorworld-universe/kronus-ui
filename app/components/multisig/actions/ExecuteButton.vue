<script setup lang="ts">
import type { Toast } from "@nuxt/ui/runtime/composables/useToast.js";
import { ComputeBudgetProgram, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { useWallet } from "solana-wallets-vue";
import { useRefresh } from "~/composables/queries/useRefresh";
import { useAuthorize } from "~/composables/useWalletConnection";

type ApproveButtonProps = {
  multisigPda: string;
  transactionIndex: number;
  proposal: multisig.generated.Proposal;
  proposalStatus: string;
  transactionsPageQuery: string;
};
const props = defineProps<ApproveButtonProps>();

const wallet = useWallet();
const { walletAddress, connected, openModal, publicKey } = useWalletConnection();
const connection = connectionManager.getCurrentConnection();

const { isMultisigMember, userCanExecute } = await useAuthorize();

const isTransactionReady = computed(() => props.proposalStatus.toLowerCase() === "approved");

const canExecute = computed(() => isMultisigMember.value && userCanExecute.value && !transactionAlreadyExecuted.value);

const toast = useToast();

const TRANSACTIONS_QUERY_KEY = computed(() => props.transactionsPageQuery);
const { refresh } = useRefresh(TRANSACTIONS_QUERY_KEY);

const transactionAlreadyExecuted = computed(() => props.proposalStatus.toLowerCase() === "executed");
const pending = ref(false);

const executeTrasnsaction = async () => {
  try {
    pending.value = true;
    if (!connected.value || !walletAddress.value || !publicKey.value) {
      openModal();
      throw "Wallet not connected";
    }

    const bigIntTransactionIndex = BigInt(props.transactionIndex);
    const transaction = new Transaction();

    const [transactionPda] = multisig.getTransactionPda({
      multisigPda: new PublicKey(props.multisigPda),
      index: bigIntTransactionIndex,
      programId: SQUADS_V4_PROGRAM_ID,
    });

    let txData: multisig.generated.Batch;
    let txType: "config" | "vault" | "batch";
    try {
      await multisig.accounts.VaultTransaction.fromAccountAddress(
        connection,
        transactionPda
      );
      txType = "vault";
    } catch {
      try {
        await multisig.accounts.ConfigTransaction.fromAccountAddress(
          connection,
          transactionPda
        );
        txType = "config";
      } catch {
        txData = await multisig.accounts.Batch.fromAccountAddress(
          connection,
          transactionPda
        );
        txType = "batch";
      }
    }

    // Build Transactions
    const transactions: VersionedTransaction[] = [];

    const member = publicKey.value;

    const { blockhash } = await connection.getLatestBlockhash();

    const priorityFee = await getTransactionPriorityFeeEstimate(connection);

    if (txType == "vault") {
      const resp = await multisig.instructions.vaultTransactionExecute({
        multisigPda: new PublicKey(props.multisigPda),
        connection,
        member,
        transactionIndex: bigIntTransactionIndex,
        programId: SQUADS_V4_PROGRAM_ID,
      });

      const executeVaultTransactionPayload = new VersionedTransaction(
        new TransactionMessage({
          instructions: [resp.instruction],
          payerKey: member,
          recentBlockhash: blockhash,
        }).compileToV0Message(resp.lookupTableAccounts)
      );

      const computeUnitsEstimate = await getComputeUnitsEstimate(executeVaultTransactionPayload, connection);
      const computeBudgetIx = [
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeUnitsEstimate,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee,
        }),
      ];

      transactions.push(
        new VersionedTransaction(
          new TransactionMessage({
            instructions: [...computeBudgetIx, resp.instruction],
            payerKey: member,
            recentBlockhash: blockhash,
          }).compileToV0Message(resp.lookupTableAccounts)
        )
      );
    } else if (txType == "config") {
      const executeConfigTransactionIx = multisig.instructions.configTransactionExecute({
        multisigPda: new PublicKey(props.multisigPda),
        member,
        rentPayer: member,
        transactionIndex: bigIntTransactionIndex,
        programId: SQUADS_V4_PROGRAM_ID,
      });

      const executeConfigTransaction = new VersionedTransaction(
        new TransactionMessage({
          instructions: [executeConfigTransactionIx],
          payerKey: member,
          recentBlockhash: blockhash,
        }).compileToV0Message()
      );

      const computeUnitsEstimate = await getComputeUnitsEstimate(executeConfigTransaction, connection);
      const computeBudgetIx = [
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeUnitsEstimate,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee,
        }),
      ];

      transactions.push(
        new VersionedTransaction(
          new TransactionMessage({
            instructions: [...computeBudgetIx, executeConfigTransactionIx],
            payerKey: member,
            recentBlockhash: blockhash,
          }).compileToV0Message()
        )
      );
      // @ts-expect-error this variable is unused
    } else if (txType == "batch" && txData) {
      const executedBatchIndex = txData.executedTransactionIndex;
      const batchSize = txData.size;

      if (executedBatchIndex === undefined || batchSize === undefined) {
        throw new Error(
          "executedBatchIndex or batchSize is undefined and can't execute the transaction"
        );
      }

      transactions.push(
        ...(await Promise.all(
          range(executedBatchIndex + 1, batchSize).map(async (batchIndex) => {
            const { instruction: transactionBatchExecuteIx, lookupTableAccounts }
              = await multisig.instructions.batchExecuteTransaction({
                connection,
                member,
                batchIndex: bigIntTransactionIndex,
                transactionIndex: batchIndex,
                multisigPda: new PublicKey(props.multisigPda),
                programId: SQUADS_V4_PROGRAM_ID,
              });

            const executeBatchTransaction = new VersionedTransaction(
              new TransactionMessage({
                instructions: [transactionBatchExecuteIx],
                payerKey: member,
                recentBlockhash: blockhash,
              }).compileToV0Message()
            );

            const computeUnitsEstimate = await getComputeUnitsEstimate(executeBatchTransaction, connection);
            const computeBudgetIx = [
              ComputeBudgetProgram.setComputeUnitLimit({
                units: computeUnitsEstimate,
              }),
              ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: priorityFee,
              }),
            ];

            const message = new TransactionMessage({
              payerKey: member,
              recentBlockhash: blockhash,
              instructions: [...computeBudgetIx, transactionBatchExecuteIx],
            }).compileToV0Message(lookupTableAccounts);

            return new VersionedTransaction(message);
          })
        ))
      );
    }

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey.value;

    for (const transaction of transactions) {
      let t: Toast;
      const signature = await signAndSendTransaction(connection, wallet, [], transaction, ({ status }) => {
        if (status === "created") {
          if (!t) {
            t = toast.add({
              description: "Pending signature",
              color: "neutral"
            });
          }
        } else if (status === "signed") {
          toast.update(t.id, {
            description: "Signed. Sending transaction ..."
          });
        } else if (status === "sent") {
          toast.update(t.id, {
            description: "Confirming..."
          });
        } else if (status === "confirmed") {
          toast.update(t.id, {
            description: "Confirmed",
            color: "success"
          });
        }
      });
      console.log("successfully approved", signature);
    }

    await refresh();
  } catch (error: any) {
    console.error(error);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <UButton :disabled="!canExecute || !isTransactionReady" @click="executeTrasnsaction">
    {{ transactionAlreadyExecuted ? 'Executed' : 'Execute' }}
  </UButton>
</template>
