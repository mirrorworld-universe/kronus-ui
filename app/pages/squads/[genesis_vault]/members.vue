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
      <UContainer>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-semibold">
              Members
            </h3>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
