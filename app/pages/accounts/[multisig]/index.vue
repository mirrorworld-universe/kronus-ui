<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import VaultsList from "~/components/multisig/VaultsList.vue";

const wallet = useWallet();

const route = useRoute();

const multisigAddress = computed(() => route.params.multisig as string);

defineRouteRules({
  ssr: false
});
</script>

<template>
  <UDashboardPanel id="create">
    <template #header>
      <UDashboardNavbar title="Create New Multisig" :ui="{ right: 'gap-3' }">
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
      <UCard v-else>
        Please connect your wallet to continue.
      </UCard>
    </template>
  </UDashboardPanel>
</template>
