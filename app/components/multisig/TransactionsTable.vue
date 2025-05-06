<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type * as _multisig from "@sqds/multisig";
import ApproveButton from "./actions/ApproveButton.vue";
import RejectButton from "./actions/RejectButton.vue";
import ExecuteButton from "./actions/ExecuteButton.vue";
import { NuxtLink } from "#components";
import { useRefresh } from "~/composables/queries/useRefresh";

const props = defineProps<{
  multisigPda: string;
  transactions: {
    transactionPda: string;
    proposal: _multisig.generated.Proposal | null;
    index: bigint;
  }[];
  transactionsQueryKey: string;
}>();

const UButton = resolveComponent("UButton");

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

const TRANSACTIONS_PAGE_QUERY_KEY = computed(() => props.transactionsQueryKey);
const { pending, refresh } = useRefresh(TRANSACTIONS_PAGE_QUERY_KEY);

type TransformedTransaction = {
  stale: boolean;
  status: string;
  transactionPda: string;
  proposalPda: string;
  transaction: _multisig.generated.VaultTransaction | null;
  proposal: _multisig.generated.Proposal | null;
  index: bigint;
};
// const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
// 'Rejected', 'Approved', 'Executing', 'Executed', 'Cancelled'
const statusToColor = (status: string) => {
  switch (status) {
    case "Active":
      return "info";
    case "Stale":
      return "neutral";
    case "Approved":
      return "warning";
    case "Executed":
      return "success";
    case "Rejected":
      return "error";
    default:
      return "neutral";
  }
};

const columns: TableColumn<TransformedTransaction>[] = [
  {
    accessorKey: "transaction",
    header: undefined,
    cell: ({ row }) => row.original.transaction?.index
  },
  {
    accessorKey: "transactionPda",
    header: "Transaction",
    cell: ({ row }) => {
      return h(NuxtLink, {
        to: createSolanaExplorerUrl(row.getValue("transactionPda")),
        target: "_blank",
        class: "flex justify-start items-center gap-2 underline decoration-dotted transition-colors underline-offset-3 hover:text-primary",
      }, () => [
        h("pre", truncateMiddle(row.getValue("transactionPda")))
      ]);
    }
  },
  {
    accessorKey: "proposalPda",
    header: "Proposal",
    cell: ({ row }) => {
      return h(NuxtLink, {
        to: createSolanaExplorerUrl(row.getValue("proposalPda")),
        target: "_blank",
        class: "flex justify-start items-center gap-2 underline decoration-dotted transition-colors underline-offset-3 hover:text-primary",
      }, () => [
        h("pre", truncateMiddle(row.getValue("proposalPda")))
      ]);
    }
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => h(UBadge, {
      class: "rounded-full",
      variant: "subtle",
      color: statusToColor(row.getValue("status"))
    }, () => row.getValue("status") === "Approved" ? "Ready" : row.getValue("status"))
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return h("div", {
        class: "flex justify-start items-center gap-3",
      },
      [
        h(ApproveButton, {
          color: "neutral",
          variant: "solid",
          proposal: row.original.proposal!,
          multisigPda: props.multisigPda,
          transactionIndex: Number(row.original.index),
          proposalStatus: row.original.status,
          transactionsPageQuery: props.transactionsQueryKey,
          class: "cursor-pointer"
        }),
        h(RejectButton, {
          color: "neutral",
          variant: "soft",
          proposal: row.original.proposal!,
          multisigPda: props.multisigPda,
          transactionIndex: Number(row.original.index),
          proposalStatus: row.original.status,
          transactionsPageQuery: props.transactionsQueryKey,
          class: "cursor-pointer"
        }),
        h(ExecuteButton, {
          color: row.original.status === "Approved" ? "success" : "neutral",
          variant: "ghost",
          proposal: row.original.proposal!,
          multisigPda: props.multisigPda,
          transactionIndex: Number(row.original.index),
          proposalStatus: row.original.status,
          transactionsPageQuery: props.transactionsQueryKey,
          class: "cursor-pointer"
        }),
      ]);
    }
  },
  {
    id: "expand",
    cell: ({ row }) =>
      h(UButton, {
        "color": "neutral",
        "variant": "ghost",
        "icon": "i-lucide-chevron-down",
        "square": true,
        "aria-label": "Expand",
        "ui": {
          leadingIcon: [
            "transition-transform",
            row.getIsExpanded() ? "duration-200 rotate-180" : ""
          ]
        },
        "onClick": () => row.toggleExpanded()
      })
  },
];
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center gap-3">
        <h2 class="text-xl font-semibold">
          Transactions
        </h2>

        <UButton
          icon="i-lucide-refresh-cw"
          size="xs"
          color="neutral"
          variant="ghost"
          :loading="pending"
          @click="() => refresh()"
        />
      </div>
    </div>

    <!-- <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="line-md:loading-twotone-loop" class="size-4" />
    </div> -->

    <div v-if="data.length === 0" class="text-center py-8 text-secondary-100">
      No transactions found for this multisig
    </div>

    <UTable
      v-else
      :data="data"
      class="flex-1"
      :columns="columns"
    >
      <template #expanded="{ row }">
        <pre>{{ row.original }}</pre>
      </template>
    </UTable>
  </div>
</template>
