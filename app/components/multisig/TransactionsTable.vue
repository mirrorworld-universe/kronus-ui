<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type * as _multisig from "@sqds/multisig";
import type { UnwrapRef } from "vue";
import ApproveButton from "./actions/ApproveButton.vue";
import RejectButton from "./actions/RejectButton.vue";
import ExecuteButton from "./actions/ExecuteButton.vue";
import { NuxtLink } from "#components";
import { useRefresh } from "~/composables/queries/useRefresh";
import type { useTransactions } from "~/composables/queries/useTransactions";
import { TransactionType, TransferAssetType } from "~~/server/validations/schemas";

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

const route = useRoute();
const pageParam = computed(() => route.query.page as string);
const page = computed(() => {
  let _page = pageParam.value ? parseInt(pageParam.value, 10) : 1;
  if (_page < 1) {
    _page = 1;
  }
  return _page;
});

watch(page, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    refresh();
  }
});

// type TransformedTransaction = {
//   stale: boolean;
//   status: string;
//   transactionPda: string;
//   proposalPda: string;
//   metadata: UnwrapRef<Awaited<ReturnType<typeof useTransactions>>["parsedTransactions"]>[number];
//   transaction: _multisig.generated.VaultTransaction | null;
//   proposal: _multisig.generated.Proposal | null;
//   index: bigint;
// };

type TransformedTransaction = UnwrapRef<Awaited<ReturnType<typeof useTransactions>>["parsedTransactions"]>[number];
// const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UAvatar = resolveComponent("UAvatar");
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

function getVaultTransactionToken(transaction: TransformedTransaction, assetTransferType: TransferAssetType) {
  const isSOL = assetTransferType === TransferAssetType.SOL;

  const vaultAccount = transaction.transaction!.message.accountKeys[1]!;

  const { data: vaultBalanceQuery } = useNuxtData<FormattedTokenBalanceWithPrice[]>(keys.tokenBalances(vaultAccount?.toBase58()));
  if (vaultBalanceQuery.value) {
    return isSOL ? vaultBalanceQuery.value.find(token => token.symbol === "SOL") : vaultBalanceQuery.value.find(token => token.mint === transaction.__metadata.tokenMint);
  }
}

const columns: TableColumn<TransformedTransaction>[] = [
  {
    accessorKey: "transaction",
    header: undefined,
    cell: ({ row }) => row.original.transaction?.index
  },
  {
    accessorKey: "metadata",
    header: undefined,
    cell: ({ row }) => {
      const isSendTransaction = row.original.__metadata.type === TransactionType.Send;
      return h("div", {
        class: "flex justify-start items-center gap-4"
      }, [
        h(UButton, {
          icon: isSendTransaction ? "solar:arrow-right-up-linear" : "solar:code-bold-duotone",
          variant: "soft",
          size: "sm",
          color: isSendTransaction ? "success" : "neutral",
        }),
        h("span", {

        }, row.original.__metadata.type)
      ]);
    }
  },
  {
    accessorKey: "transactionPda",
    header: "Detail",
    cell: ({ row }) => {
      const isSendTransaction = row.original.__metadata.type === TransactionType.Send;
      const isSOL = row.original.__metadata.assetType === TransferAssetType.SOL;

      return h("div", {
        class: "flex justify-start items-center gap-2"
      }, isSendTransaction
        ? [
            h(UAvatar, {
              src: isSOL ? "/sol.png" : getVaultTransactionToken(row.original, row.original.__metadata.assetType!)?.metadata?.image,
              variant: "soft",
              size: "xs",
              color: isSendTransaction ? "success" : "neutral",
            }),
            h("span", [
              isSOL
                ? tokenAmountFormatter.format(parseSOLTransferInstruction(JSON.parse(JSON.stringify(row.original.transaction!.message)) as any as SolanaTransactionMessage).amountInSOL)
                : tokenAmountFormatter.format(row.original.__metadata.amount)
            ])
          ]
        : []);
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
          proposalStatus: row.original.proposal!.status.__kind,
          transactionsPageQuery: props.transactionsQueryKey,
          class: "cursor-pointer"
        }),
        h(RejectButton, {
          color: "neutral",
          variant: "soft",
          proposal: row.original.proposal!,
          multisigPda: props.multisigPda,
          transactionIndex: Number(row.original.index),
          proposalStatus: row.original.proposal!.status.__kind,
          transactionsPageQuery: props.transactionsQueryKey,
          class: "cursor-pointer"
        }),
        h(ExecuteButton, {
          color: row.original.proposal!.status.__kind === "Approved" ? "success" : "neutral",
          variant: "ghost",
          proposal: row.original.proposal!,
          multisigPda: props.multisigPda,
          transactionIndex: Number(row.original.index),
          proposalStatus: row.original.proposal!.status.__kind,
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
        "class": "cursor-pointer",
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
        <UCard variant="soft">
          <pre>{{ row }}</pre>
        </UCard>
      </template>
    </UTable>
  </div>
</template>
