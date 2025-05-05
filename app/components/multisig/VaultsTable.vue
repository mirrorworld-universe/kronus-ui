<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import * as multisig from "@sqds//multisig";
import { PublicKey } from "@solana/web3.js";
import type { IVault } from "@/types/squads";
import { useRefresh } from "~/composables/queries/useRefresh";
import { keys } from "@/utils/state.keys";

const UButton = resolveComponent("UButton");
const NuxtLink = resolveComponent("NuxtLink");

const props = defineProps<{
  multisigAddress: string;
}>();

// const { connection } = useConnection();
// const solanaConnection = computed(() => connection.value as Connection);

type TransformedVault = {
  balance: number;
  name: string;
  address: string;
  vault_index: number;
  tokens: FormattedTokenBalanceWithPrice[];
  weight: number;
  vaultTokensValue: string;
};

const route = useRoute();
const genesisVault = computed(() => route.params.genesis_vault as string);

const VAULTS_QUERY_KEY = computed(() => keys.vaults(props.multisigAddress));

const { data } = useNuxtData<IVault[]>(VAULTS_QUERY_KEY.value);

const { pending, refresh } = useRefresh(VAULTS_QUERY_KEY);

const vaults = computed(() => (data.value || []).map(vault => ({
  name: vault.name,
  address: vault.public_key,
  vault_index: vault.vault_index,
  balance: 0,
})).sort((a, b) => a.vault_index - b.vault_index));

// ====== Vaults Token Balances ======
const vaultsWithTokenBalances = computed(() => vaults.value.map((vault) => {
  const vaultTokens = useNuxtData<FormattedTokenBalanceWithPrice[]>(keys.tokenBalances(vault.address))?.data.value || [];
  const vaultTokensValue = vaultTokens.reduce((acc, curr) => acc + curr.tokenValue, 0);
  return {
    ...vault,
    tokens: vaultTokens,
    __rawValue: vaultTokensValue,
    vaultTokensValue: Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencySign: "standard",
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(vaultTokensValue)
  };
}));

const vaultsWithWeightedTokenBalances = computed(() => calculateWeights(vaultsWithTokenBalances.value, "__rawValue"));

// ====== Vaults Token Balances ======

function truncateMiddle(input: string) {
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

const UAvatar = resolveComponent("UAvatar");
const UProgress = resolveComponent("UProgress");

const columns = computed<TableColumn<TransformedVault>[]>(() => ([
  {
    accessorKey: "address",
    header: "Account",
    cell: ({ row }) => {
      return h("span", {
        class: "flex flex-col gap-1",
      }, [
        h(NuxtLink, { class: "text-(--ui-text)", to: `/squads/${genesisVault.value}/treasury/${row.getValue("address")}` }, () => row.original.name),
        h("div", { class: "flex justify-start items-center gap-2 text-xs" }, [
          truncateMiddle(row.getValue("address")),
          h(UButton, {
            icon: "solar:copy-linear", size: "xs", color: "neutral", variant: "ghost",
            onClick: () => copyToClipboard(row.getValue("address")),
            class: "text-(--ui-muted) hover:text-(--ui-text)"
          })
        ])
      ]);
    }
  },
  {
    accessorKey: "vaultTokensValue",
    header: "Balance",
    cell: ({ row }) => {
      return h("div", {
        class: "flex flex-col gap-1"
      }, [
        h("div", {
          class: "flex items-center justify-start gap-3"
        }, [
          h("div", { class: "text-(--ui-text)" }, row.getValue("vaultTokensValue")),
          h("div", { class: "flex items-center" }, [
            // First 3 tokens
            ...row.original.tokens.slice(0, 3).map(token => h(UAvatar, {
              class: "-ml-1",
              size: "2xs",
              src: token.symbol === "SOL" ? "/sol.png" : token.metadata?.image,
              alt: token.symbol,
            })),
            // +X indicator if there are more tokens
            row.original.tokens.length > 3 && h("div", {
              class: "-ml-1 text-[10px] text-neutral-500 bg-neutral-100 rounded-full roun h-5 w-5 flex justify-center items-center"
            }, `+${row.original.tokens.length - 3}`)
          ])
        ])
      ]);
    }
  },
  // {
  //   accessorKey: "tokens",
  //   header: "Tokens",
  //   cell: ({ row }) => h(UAvatarGroup, { max: 4, size: "2xs" }, () => row.original.tokens.map(token => h(UAvatar, {
  //     class: "-ml-1",
  //     src: token.symbol === "SOL" ? "/sol.png" : token.metadata?.image,
  //     alt: token.symbol,
  //   })))
  // },
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
]));
const newAccountName = ref("");
const isAddAccountModalOpen = ref(false);
const isPending = ref(false);
async function handleCreateAccount() {
  try {
    isPending.value = true;

    const nextVaultIndex = (Math.max(...(vaults.value || []).map(v => v.vault_index)) || 0) + 1;

    const [nextVaultPublicKey] = multisig.getVaultPda({
      index: nextVaultIndex,
      multisigPda: new PublicKey(props.multisigAddress),
      programId: SQUADS_V4_PROGRAM_ID,
    });

    const result = await $fetch(`/api/vaults/${props.multisigAddress}`, {
      method: "POST",
      body: {
        vault_index: nextVaultIndex,
        name: newAccountName.value,
        public_key: nextVaultPublicKey.toBase58()
      }
    });

    if (result.public_key) {
      toast.add({
        description: "Vault created!",
        color: "success"
      });
      await refresh();
    }
  } catch (error: any) {
    toast.add({
      title: "Error creating Vault",
      description: error.message,
      color: "error"
    });
  } finally {
    newAccountName.value = "";
    isPending.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center gap-3">
        <h2 class="text-xl font-semibold">
          Vaults
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

      <UModal
        v-model:open="isAddAccountModalOpen"
        title="Add Account"
        description="Add a new vault account to your multisig"
        :ui="{ footer: 'justify-end' }"
      >
        <UButton leading-icon="line-md:plus" :loading="isPending">
          Add Account
        </UButton>

        <template #body>
          <UFormField label="Account name" required>
            <UInput v-model="newAccountName" placeholder="Enter account name" />
          </UFormField>
        </template>

        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            @click="isAddAccountModalOpen = false"
          />
          <UButton label="Finish" color="neutral" @click="handleCreateAccount" />
        </template>
      </UModal>
    </div>

    <!-- <UCard v-if="error" color="red" class="mb-4">
      {{ error }}
    </UCard> -->

    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="line-md:loading-twotone-loop" class="size-4" />
    </div>

    <div v-else-if="vaultsWithTokenBalances.length === 0" class="text-center py-8 text-secondary-100">
      No vaults found for this multisig
    </div>

    <UTable
      v-else
      :data="vaultsWithWeightedTokenBalances"
      :columns="columns"
      class="flex-1"
    />
  </div>
</template>
