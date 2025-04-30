<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import CreateMultisig from "~/components/home/CreateMultisig.vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import { useRefresh } from "~/composables/queries/useRefresh";
import type { Multisig } from "~/types/squads";

const wallet = useWallet();

defineRouteRules({
  ssr: false
});

const { walletAddress } = useWalletConnection();

const MULTISIGS_BY_MEMBER_QUERY_KEY = computed(() => keys.multisigsByMember(walletAddress.value!));

const { data: multisigs } = await useNuxtData<Multisig[]>(MULTISIGS_BY_MEMBER_QUERY_KEY.value);
const { refresh } = useRefresh(MULTISIGS_BY_MEMBER_QUERY_KEY);

const router = useRouter();

watchOnce(multisigs, (newValue) => {
  if (newValue && newValue.length > 0) {
    const defaultVault = newValue[0]?.first_vault;
    if (defaultVault) {
      router.push(`/squads/${defaultVault}/home`);
    }
  }
}, {
  immediate: true
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
