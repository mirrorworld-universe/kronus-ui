<script setup lang="ts">
import CreateMultisig from "~/components/home/CreateMultisig.vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";

defineRouteRules({
  ssr: false
});

definePageMeta({
  layout: "create"
});

const router = useRouter();
function handleCancel() {
  router.push(`/`);
}
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
      <CreateMultisig @cancel="handleCancel" />
    </template>
  </UDashboardPanel>
</template>
