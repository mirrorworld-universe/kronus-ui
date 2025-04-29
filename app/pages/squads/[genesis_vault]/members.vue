<script setup lang="ts">
import WalletConnectButton from "~/components/WalletConnectButton.vue";

defineRouteRules({
  ssr: false
});
</script>

<template>
  <UDashboardPanel id="members">
    <template #header>
      <UDashboardNavbar title="Members" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        Members
      </UCard>
    </template>
  </UDashboardPanel>
</template>
