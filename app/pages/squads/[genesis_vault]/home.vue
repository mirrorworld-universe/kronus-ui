<script setup lang="ts">
// import { useWallet } from "solana-wallets-vue";

import WalletConnectButton from "~/components/WalletConnectButton.vue";
import { useMultisig } from "~/composables/queries/useMultisigs";
import type { IMultisig, IVault } from "~/types/squads";

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

const prettifiedData = computed(() => data.value);
const computedMultisigData = computed(() => ({
  address: genesisVault.value,
  members: (prettifiedData.value?.members || []),
  threshold: prettifiedData.value?.threshold || 0,
}));

const threshold = computed(() => {
  return `${computedMultisigData.value.threshold} / ${computedMultisigData.value.members.length}`;
});

const VAULTS_QUERY_KEY = computed(() => keys.vaults(multisigAddress.value));
const { data: vaults } = useNuxtData<IVault[]>(VAULTS_QUERY_KEY.value);

watchEffect(() => {
  (vaults.value || []).forEach((vault) => {
    useAsyncData(keys.tokenBalances(vault.public_key), () => $fetch(`/api/balances/${vault.public_key}`));
  });
});

const totalMultisigsValue = computed(() => (vaults.value || []).map((vault) => {
  const vaultTokens = useNuxtData<FormattedTokenBalanceWithPrice[]>(keys.tokenBalances(vault.public_key))?.data.value || [];
  const vaultTokensValue = vaultTokens.reduce((acc, curr) => acc + curr.tokenValue, 0);
  return vaultTokensValue;
}).reduce((acc, curr) => acc + curr, 0));

const stats = computed(() => ([
  { name: "Total Balance", value: usdAmountFormatter.format(totalMultisigsValue.value) },
  { name: "Members", value: computedMultisigData.value.members.length },
  { name: "Threshold", value: threshold.value },
]));
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
