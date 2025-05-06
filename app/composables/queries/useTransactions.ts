import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import type { z } from "zod";
import { useGenesisVault } from "./useGenesisVault";
import type { IMultisig } from "~/types/squads";
import type { Database } from "~~/server/schema.gen";
import type { createTransactionSchema } from "~~/server/validations/schemas";
import { TransactionType } from "~~/server/validations/schemas";

export const TRANSACTIONS_PER_PAGE = 24;

export type TransactionQueryResult = {
  transactionPda: [PublicKey, number];
  proposalPda: [PublicKey, number];
  proposal: multisig.generated.Proposal;
  transaction: multisig.generated.VaultTransaction;
  index: bigint;
};

function SerializableBigInt(val: bigint) {
  return Object.assign(BigInt(val), {
    toJSON() {
      return this.toString();
    },
  });
}

export async function useTransactions() {
  const { genesisVault } = await useGenesisVault();
  const route = useRoute();

  const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
  const { data: __multisig } = useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);
  const multisigAddress = computed(() => __multisig.value!.id);

  const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(multisigAddress.value));
  const { data: multisig } = useNuxtData<multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value);

  const pageParam = computed(() => route.query.page as string);
  const page = computed(() => {
    let _page = pageParam.value ? parseInt(pageParam.value, 10) : 1;
    if (_page < 1) {
      _page = 1;
    }
    return _page;
  });

  const totalTransactions = computed(() => Number(multisig.value ? multisig.value.transactionIndex : 0));
  const totalPages = computed(() => Math.ceil(totalTransactions.value / TRANSACTIONS_PER_PAGE));

  const startIndex = computed(() => totalTransactions.value - (page.value - 1) * TRANSACTIONS_PER_PAGE);
  const endIndex = computed(() => Math.max(startIndex.value - TRANSACTIONS_PER_PAGE + 1, 1));

  const TRANSACTIONS_PAGE_QUERY_KEY = computed(() => keys.transactions({
    startIndex: startIndex.value,
    endIndex: endIndex.value,
    programId: SQUADS_V4_PROGRAM_ID.toBase58(),
    multisigAddress: multisigAddress.value,
    page: page.value
  }));

  const connection = connectionManager.getCurrentConnection();

  type MetadataField = z.infer<typeof createTransactionSchema>["metadata"];

  const { data: latestTransactions } = await useAsyncData(TRANSACTIONS_PAGE_QUERY_KEY.value, async () => {
    if (!multisigAddress.value) return null;

    try {
      const multisigPda = new PublicKey(multisigAddress.value);
      const results: TransactionQueryResult[] = [];

      for (let i = 0; i <= startIndex.value - endIndex.value; i++) {
        const index = BigInt(startIndex.value - i);
        const transaction = await fetchTransactionData(connection, multisigPda, index, SQUADS_V4_PROGRAM_ID);
        // @ts-expect-error doesnt't check null
        results.push(transaction);
      }

      const transactionsMetadata = await $fetch<(Database["public"]["Tables"]["transactions"]["Row"])[]>(`/api/vaults/${multisigAddress.value}/transactions`);
      const metadataCache: Record<string, (typeof transactionsMetadata)[number]> = {};
      for (let i = 0; i < transactionsMetadata.length; i++) {
        const tx = transactionsMetadata[i]!;
        metadataCache[tx.transaction_pda] = tx;
      }

      return results.map(result => ({
        ...result,
        ...(metadataCache[result.transactionPda[0].toBase58()] ? { __metadata: metadataCache[result.transactionPda[0].toBase58()]!.metadata as MetadataField } : { __metadata: { type: TransactionType.Arbitrary } as MetadataField })
      }));
    } catch {
      return undefined;
    }
  });

  const transactions = computed(() => (latestTransactions.value || []).map((transaction) => {
    return {
      ...transaction,
      proposal: transaction.proposal,
      transactionPda: transaction.transactionPda[0].toBase58(),
      proposalPda: transaction.proposalPda[0].toBase58(),
      index: SerializableBigInt(transaction.index)
    };
  }));

  const parsedTransactions = computed(() => transactions.value.map(transaction => ({
    ...transaction,
    __parsed: classifyAndExtractTransaction(transaction)
  })));

  function goToPage(page: number) {
    return {
      query: {
        page
      },
    };
  }

  return {
    page,
    goToPage,
    transactions,
    totalTransactions,
    parsedTransactions,
    totalPages,
    multisigAddress,
    TRANSACTIONS_PAGE_QUERY_KEY
  };
}

// export type TransactionsType = Awaited<ReturnType<Awaited<typeof useTransactions>>>["transactions"];

/** Fetch transaction data */
async function fetchTransactionData(
  connection: Connection,
  multisigPda: PublicKey,
  index: bigint,
  programId: PublicKey
) {
  const transactionPda = multisig.getTransactionPda({
    multisigPda,
    index,
    programId,
  });
  const proposalPda = multisig.getProposalPda({
    multisigPda,
    transactionIndex: index,
    programId,
  });

  let proposal;
  try {
    proposal = await multisig.accounts.Proposal.fromAccountAddress(connection, proposalPda[0]);
  } catch {
    proposal = null;
  }

  let transaction;
  try {
    transaction = await multisig.accounts.VaultTransaction.fromAccountAddress(connection, transactionPda[0]);
  } catch {
    transaction = null;
  }

  return { transactionPda, transaction, proposalPda, proposal, index };
}
