<script setup lang="ts">
import type * as _multisig from "@sqds/multisig";

const props = defineProps<{
  multisigPda: string;
  transactions: {
    transactionPda: string;
    proposal: _multisig.generated.Proposal | null;
    index: bigint;
  }[];
}>();

const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(props.multisigPda));
const { data: multisig } = useNuxtData<_multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value);

const data = computed(() => props.transactions.map((transaction) => {
  const stale = (multisig.value
    && Number(multisig.value.staleTransactionIndex) > Number(transaction.index)) || false;
  return {
    ...transaction,
    stale,
    status: stale ? "Stale" : transaction.proposal?.status.__kind || "None"
  };
}));
</script>

<template>
  <div>Transactions list</div>
  <pre>{{ data }}</pre>
</template>
