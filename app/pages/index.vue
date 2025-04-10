<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import CreateMultisig from "~/components/home/CreateMultisig.vue";

const wallet = useWallet();
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
      <CreateMultisig v-if="wallet.connected.value" />
      <UCard v-else>
        Please connect your wallet to continue.
      </UCard>
    </template>
  </UDashboardPanel>
</template>
