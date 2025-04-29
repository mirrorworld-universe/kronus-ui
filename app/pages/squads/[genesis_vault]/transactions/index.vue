<script setup lang="ts">
import WalletConnectButton from "~/components/WalletConnectButton.vue";

defineRouteRules({
  ssr: false
});
</script>

<template>
  <UDashboardPanel id="transactions">
    <template #header>
      <UDashboardNavbar title="Transactions" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>Transactions list</div>
    </template>
  </UDashboardPanel>
</template>
