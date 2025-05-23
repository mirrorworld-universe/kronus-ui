<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useRefresh } from "~/composables/queries/useRefresh";
import type { FormattedTokenBalanceWithPrice } from "~/utils/token-balances";
import type { IVault, IMultisig } from "~/types/squads";

const UButton = resolveComponent("UButton");

// const { connection } = useConnection();
// const solanaConnection = computed(() => connection.value as Connection);

type TransformedToken = {
  name: string;
  symbol: string;
  balance: string;
  mint: string;
  image?: string | null;
  uiAmount: number;
  tokenAccount: string;
  tokenValue: number;
  weight: number;
};

const route = useRoute();

const vaultAccount = computed(() => route.params.account as string);
const genesisVault = computed(() => route.params.genesis_vault as string);
const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const VAULT_BALANCE_QUERY_KEY = computed(() => keys.tokenBalances(vaultAccount.value));
const { data: multisig } = await useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);
const multisigAddress = computed(() => multisig.value!.id);

const VAULTS_QUERY_KEY = computed(() => keys.vaults(multisigAddress.value));

const { data: vaults } = useNuxtData<IVault[]>(VAULTS_QUERY_KEY.value);
const { data } = useNuxtData<FormattedTokenBalanceWithPrice[]>(VAULT_BALANCE_QUERY_KEY.value);
const { refresh, pending } = useRefresh(VAULT_BALANCE_QUERY_KEY);

const tokens = computed<TransformedToken[]>(() => calculateWeights((data.value || []).map(token => ({
  name: token.name,
  symbol: token.symbol,
  balance: token.amount,
  mint: token.mint,
  uiAmount: token.uiAmount,
  tokenAccount: token.address,
  image: token.metadata?.image,
  tokenValue: token.tokenValue
})), "tokenValue"));

const currentVault = computed(() => (vaults.value || []).find(v => v.public_key === vaultAccount.value));

function truncateMiddle(input: string) {
  if (!input) return input;
  return `${input.slice(0, 4)}...${input.slice(
    -4
  )}`;
}

const toast = useToast();

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "Copied!",
      icon: "line-md:confirm-circle",
      color: "success",
    });
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};

function handleClickSendToken(token: TransformedToken) {
  emitter.emit("send:open", {
    vaultAccount: vaultAccount.value,
    tokenSymbol: token.symbol
  });
}

function handleClickReceiveToken(token: TransformedToken) {
  console.log("clicked receive token", token);
  toast.add({
    title: "Receiving tokens coming soon",
    icon: "line-md:loading-twotone-loop",
    color: "info",
  });
}

const UAvatar = resolveComponent("UAvatar");
const UProgress = resolveComponent("UProgress");
const UIcon = resolveComponent("UIcon");

const columns: TableColumn<TransformedToken>[] = [
  {
    accessorKey: "symbol",
    header: "Token",
    cell: ({ row }) => {
      return h("div", {
        class: "flex justify-start items-center gap-2",
      },
      [
        h(UAvatar, {
          src: row.original.symbol === "SOL" ? "/sol.png" : row.original.image,
          alt: row.getValue("symbol")
        }),
        h("div", {
          class: "flex flex-col",
        }, [
          h("span", { class: "leading-none text-(--ui-text)" }, row.getValue("symbol")),
          h("span", { class: "leading-none flex justify-start items-center gap-1 text-xs" }, [
            h("a", {
              href: createSolanaExplorerUrl(row.original.mint),
              target: "_blank",
              class: "underline decoration-dashed transition-colors underline-offset-3 hover:text-primary flex items-center gap-1"
            }, [
              truncateMiddle(row.original.mint),
              h(UIcon, { name: "material-symbols:arrow-outward-rounded" })
            ]),
          ])
        ])
      ]);
    }
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      return h("div", {
        class: "flex flex-col gap-1"
      }, [
        h("div", { class: "text-(--ui-text)" }, tokenAmountFormatter.format(row.original.uiAmount)),
      ]);
    }
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => {
      return h("div", {
        class: "flex flex-col gap-1"
      }, [
        h("div", { class: "text-(--ui-text)" }, usdAmountFormatter.format(row.original.tokenValue)),
      ]);
    }
  },
  {
    accessorKey: "weight",
    header: "Weight",
    cell: ({ row }) => {
      return h("div", {
        class: "flex flex-col gap-1"
      }, [
        h("div", { class: "text-sm" }, percentageFormatter.format(row.getValue("weight"))),
        h(UProgress, {
          size: "sm",
          color: "neutral",
          modelValue: row.getValue("weight") as number * 100
        })
      ]);
    }
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return h("div", {
        class: "flex justify-start items-center gap-3",
      },
      [
        h(UButton, {
          icon: "line-md:arrow-up",
          ariaLabel: `Send ${row.getValue("symbol")}`,
          color: "neutral",
          variant: "subtle",
          onClick: () => handleClickSendToken(row.original)
        }),
        h(UButton, {
          icon: "line-md:arrow-down",
          ariaLabel: `Receive ${row.getValue("symbol")}`,
          color: "neutral",
          variant: "subtle",
          onClick: () => handleClickReceiveToken(row.original)
        }),
      ]);
    }
  },
];
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center gap-3">
        <h2 class="text-xl font-semibold">
          {{ currentVault?.name }}
        </h2>

        <UTooltip text="Copy vault address to clipboard">
          <UButtonGroup size="lg">
            <UButton
              color="neutral"
              trailing-icon="solar:copy-linear"
              variant="soft"
              @click="() => copyToClipboard(vaultAccount)"
            >
              {{ truncateMiddle(vaultAccount) }}&nbsp;&nbsp;&nbsp;|
            </UButton>
          </UButtonGroup>
        </UTooltip>

        <UTooltip text="Refresh account balances">
          <UButton
            icon="i-lucide-refresh-cw"
            size="xs"
            color="neutral"
            variant="ghost"
            :loading="pending"
            @click="() => refresh()"
          />
        </UTooltip>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="line-md:loading-twotone-loop" class="size-4" />
    </div>

    <div v-else-if="tokens.length === 0" class="text-center py-8 text-secondary-100">
      No vaults found for this multisig
    </div>

    <UTable
      v-else
      :data="tokens"
      :columns="columns"
      class="flex-1"
    />
  </div>
</template>
