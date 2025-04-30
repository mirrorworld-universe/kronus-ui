<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import TokensTable from "~/components/multisig/TokensTable.vue";
import type { Multisig, Vault } from "~/types/squads";

defineRouteRules({
  ssr: false
});

const wallet = useWallet();
const route = useRoute();

const genesisVault = computed(() => route.params.genesis_vault as string);
const vaultAccount = computed(() => route.params.account as string);

const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const { data: multisig } = await useNuxtData<Multisig>(MULTISIG_QUERY_KEY.value);

const multisigAddress = computed(() => multisig.value!.id);

const VAULTS_QUERY_KEY = computed(() => keys.vaults(multisigAddress.value));
const { data } = useNuxtData<Vault[]>(VAULTS_QUERY_KEY.value);

const vaults = computed(() => (data.value || []).map(vault => ({
  name: vault.name,
  address: vault.public_key,
  vault_index: vault.vault_index,
  balance: 0,
})).sort((a, b) => a.vault_index - b.vault_index));

const currentVault = computed(() => vaults.value.find(v => v.address === vaultAccount.value));
</script>

<template>
  <UDashboardPanel :id="`treasury-${currentVault?.address}`">
    <template #header>
      <UDashboardNavbar :title="`Treasury – ${currentVault?.name}`" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <TokensTable v-if="wallet?.connected.value" :multisig-address="multisigAddress" />
    </template>
  </UDashboardPanel>
</template>
