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
const route = useRoute();

// use mainnet if no network is provided and force URL to update
if (!route.query.network) {
  router.push(`${route.path}?network=mainnet`);
}

const { network, setNetwork } = useConnection();

if (route.query.network && route.query.network !== network.value) {
  setNetwork(route.query.network as Network);
}

function handleCancel() {
  if (!network.value) {
    router.push(`/`);
  }
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

    <template #body>``
      <CreateMultisig @cancel="handleCancel" />
    </template>
  </UDashboardPanel>
</template>
