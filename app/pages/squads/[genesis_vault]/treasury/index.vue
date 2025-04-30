<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import VaultsTable from "~/components/multisig/VaultsTable.vue";
import type { IMultisig, IVault } from "~/types/squads";

defineRouteRules({
  ssr: false
});

const wallet = useWallet();
const route = useRoute();

const genesisVault = computed(() => route.params.genesis_vault as string);
const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const { data: multisig } = await useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);

const multisigAddress = computed(() => multisig.value!.id);
const VAULTS_QUERY_KEY = computed(() => keys.vaults(multisigAddress.value));

const { data: vaults } = useNuxtData<IVault[]>(VAULTS_QUERY_KEY.value);

watchEffect(() => {
  (vaults.value || []).forEach((vault) => {
    useAsyncData(keys.tokenBalances(vault.public_key), () => $fetch(`/api/balances/${vault.public_key}`));
  });
});
</script>

<template>
  <UDashboardPanel id="treasury">
    <template #header>
      <UDashboardNavbar title="Treasury" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <VaultsTable v-if="wallet?.connected.value" :multisig-address="multisigAddress" />
    </template>
  </UDashboardPanel>
</template>
