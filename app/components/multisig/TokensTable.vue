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

const tokens = computed<TransformedToken[]>(() => (data.value || []).map(token => ({
  name: token.name,
  symbol: token.symbol,
  balance: token.amount,
  mint: token.mint,
  uiAmount: token.uiAmount,
  tokenAccount: token.address,
  image: token.metadata?.image,
  tokenValue: token.tokenValue
})));

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
  console.log("clicked send token", token);
  toast.add({
    title: "Sending tokens coming soon",
    icon: "line-md:loading-twotone-loop",
    color: "info",
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
            truncateMiddle(row.original.mint),
            h(UButton, {
              icon: "solar:copy-linear", size: "xs", color: "neutral", variant: "ghost",
              onClick: () => copyToClipboard(row.original.mint),
              class: "text-(--ui-muted) hover:text-(--ui-text)"
            })
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
        h("div", { class: "text-(--ui-text)" }, Intl.NumberFormat("en-US", {
          currencySign: "standard",
          minimumFractionDigits: 2,
          minimumSignificantDigits: 2
        }).format(row.original.uiAmount)),
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
        h("div", { class: "text-(--ui-text)" }, Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          currencySign: "standard",
          minimumFractionDigits: 2,
          maximumFractionDigits: 3,
        }).format(row.original.tokenValue)),
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

        <UButton
          icon="i-lucide-refresh-cw"
          size="xs"
          color="neutral"
          variant="ghost"
          :loading="pending"
          @click="() => refresh()"
        />
      </div>

      <!-- <UButton leading-icon="line-md:plus">
        Propo
      </UButton> -->
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

    <!-- <div v-else class="space-y-4">
      <UCard v-for="vault in vaults" :key="vault.public_key">
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <div class="font-medium">
              Vault
            </div>
            <div class="text-sm text-secondary-100 font-mono">
              {{ vault.name }}
            </div>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-copy"
            @click="copyToClipboard(vault.public_key)"
          />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-secondary-100">
              Address
            </div>
            <div class="font-mono">
              {{ vault.public_key.slice(0, 8) }}...
            </div>
          </div>
          <div>
            <div class="text-secondary-100">
              Created
            </div>
            <div>Unknown</div>
          </div>
        </div>
      </UCard>
    </div> -->
  </div>
</template>
