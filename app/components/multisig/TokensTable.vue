<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

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
};

const route = useRoute();

const genesisVault = computed(() => route.params.genesis_vault as string);
const vaultAccount = computed(() => route.params.account as string);

const { data, error, refresh, status } = useAsyncData(keys.tokenBalances(vaultAccount.value), () => $fetch(`/api/balances/${vaultAccount.value}`));
const pending = computed(() => status.value === "pending");
const vaults = computed(() => (data.value || []).map(vault => ({
  name: vault.name,
  address: vault.public_key,
  vault_index: vault.vault_index,
  balance: 0,
})).sort((a, b) => a.vault_index - b.vault_index));

const currentVault = computed(() => vaults.value.find(v => v.address === vaultAccount.value));

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

const columns: TableColumn<TransformedVault>[] = [
  {
    accessorKey: "address",
    header: "Account",
    cell: ({ row }) => {
      return h(NuxtLink, {
        class: "flex flex-col gap-1",
        to: `/squads/${genesisVault.value}/treasury/${row.getValue("address")}`
      }, () => [
        h("div", { class: "text-neutral-50" }, row.original.name),
        h("div", { class: "flex justify-start items-center gap-2 text-xs" }, [
          truncateMiddle(row.getValue("address")),
          h(UButton, {
            icon: "solar:copy-linear", size: "xs", color: "neutral", variant: "ghost",
            onClick: () => copyToClipboard(row.getValue("address")),
            class: "text-neutral-200"
          })
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
      }, () => [
        h("div", { class: "text-neutral-50" }, Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          currencySign: "standard",
          minimumFractionDigits: 2,
          minimumSignificantDigits: 3
        }).format(row.original.balance)),
        // TODO: Replace with list of all 3 token balances
        // h("div", { class: "flex justify-start items-center gap-2 text-xs" }, [
        //   truncateMiddle(row.getValue("address")),
        //   h(UButton, {
        //     icon: "solar:copy-linear", size: "xs", color: "neutral", variant: "ghost",
        //     onClick: () => copyToClipboard(row.getValue("address")),
        //     class: "text-neutral-200"
        //   })
        // ])
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

    <UCard v-if="error" color="red" class="mb-4">
      {{ error }}
    </UCard>

    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="line-md:loading-twotone-loop" class="size-4" />
    </div>

    <div v-else-if="vaults.length === 0" class="text-center py-8 text-secondary-100">
      No vaults found for this multisig
    </div>

    <UTable
      v-else
      :data="vaults"
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
