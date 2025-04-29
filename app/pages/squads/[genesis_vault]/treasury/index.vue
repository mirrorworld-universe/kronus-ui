<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import VaultsList from "~/components/multisig/VaultsList.vue";

defineRouteRules({
  ssr: false
});

const wallet = useWallet();
const route = useRoute();

const genesisVault = computed(() => route.params.genesis_vault as string);
const { data: multisig } = await useFetch(`/api/multisigs/${genesisVault.value}`);
const multisigAddress = computed(() => multisig.value!.id);
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
      <VaultsList v-if="wallet?.connected.value" :multisig-address="multisigAddress" />
    </template>
  </UDashboardPanel>
</template>
