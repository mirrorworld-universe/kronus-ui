<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import CreateMultisig from "~/components/home/CreateMultisig.vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import { useRefresh } from "~/composables/queries/useRefresh";
import type { IMultisig } from "~/types/squads";

const wallet = useWallet();

defineRouteRules({
  ssr: false
});

const { walletAddress } = useWalletConnection();

const { network, setNetwork } = useConnection();

const router = useRouter();
const route = useRoute();

if (!route.query.network) {
  router.push(`/?network=mainnet`);
}

const MULTISIGS_BY_MEMBER_QUERY_KEY = computed(() => keys.multisigsByMember(walletAddress.value!, network.value));

const { data: multisigs } = await useNuxtData<IMultisig[]>(MULTISIGS_BY_MEMBER_QUERY_KEY.value);
const { refresh } = useRefresh(MULTISIGS_BY_MEMBER_QUERY_KEY);

watchOnce(multisigs, (newValue) => {
  if (newValue && newValue.length > 0) {
    const defaultVault = newValue[0]?.firstVault;
    if (defaultVault) {
      refresh();
      router.push(`/squads/${defaultVault}/home?network=${network.value}`);
    }
  } else {
    router.push(`/create?network=${network.value}`);
  }
}, {
  immediate: true
});

// Watch for network changes and update the connection manager
watch(network, (newNetwork) => {
  if (newNetwork) {
    setNetwork(newNetwork);
    router.push(`/?network=${newNetwork}`);
    // console.log("Network changed to", newNetwork);
    // console.log("Connection established to", connectionManager.getCurrentConnection().rpcEndpoint);
  }
});

</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CreateMultisig v-if="wallet.connected.value" @created="refresh" />
      <UCard v-else>
        Please connect your wallet to continue.
      </UCard>
    </template>
  </UDashboardPanel>
</template>
