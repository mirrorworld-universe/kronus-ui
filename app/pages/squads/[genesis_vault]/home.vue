<script setup lang="ts">
// import { useWallet } from "solana-wallets-vue";

import WalletConnectButton from "~/components/WalletConnectButton.vue";
import { useMultisig } from "~/composables/queries/useMultisigs";
import type { IMultisig } from "~/types/squads";

// const wallet = useWallet();

defineRouteRules({
  ssr: false
});

const route = useRoute();
const genesisVault = computed(() => route.params.genesis_vault as string);

const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const { data: multisig } = await useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);

const multisigAddress = computed(() => multisig.value!.id);

const { data } = await useMultisig(multisigAddress);

const prettifiedData = computed(() => data.value?.pretty());
const computedMultisigData = computed(() => ({
  address: genesisVault.value,
  members: (prettifiedData.value?.members || []),
  threshold: prettifiedData.value?.threshold || 0,
}));

const threshold = computed(() => {
  return `${computedMultisigData.value.threshold} / ${computedMultisigData.value.members.length}`;
});

const stats = [
  { name: "Total Balance", value: "$0" },
  { name: "Members", value: computedMultisigData.value.members.length },
  { name: "Threshold", value: threshold.value },
];
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <UCard variant="soft">
          <template #header>
            <h3 class="text-2xl font-semibold">
              Dashboard
            </h3>
          </template>

          <div>
            <div class="mx-auto max-w-7xl">
              <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 divide-x divide-(--ui-border)">
                <div v-for="stat in stats" :key="stat.name" class="px-4 py-6 sm:px-6 lg:px-8">
                  <p class="text-sm/6 font-medium text-gray-400">
                    {{ stat.name }}
                  </p>
                  <p class="mt-2 flex items-baseline gap-x-2">
                    <span class="text-4xl font-semibold tracking-tight text-white">{{ stat.value }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="h-4" />
          </template>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
