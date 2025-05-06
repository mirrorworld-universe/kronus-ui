<script setup lang="ts">
import TransactionsTable from "~/components/multisig/TransactionsTable.vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import { useTransactions, TRANSACTIONS_PER_PAGE } from "~/composables/queries/useTransactions";

defineRouteRules({
  ssr: false
});

const { page, goToPage: to, totalTransactions, parsedTransactions, multisigAddress, TRANSACTIONS_PAGE_QUERY_KEY } = await useTransactions();
</script>

<template>
  <Suspense>
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
        <TransactionsTable :multisig-pda="multisigAddress" :transactions="parsedTransactions" :transactions-query-key="TRANSACTIONS_PAGE_QUERY_KEY" />
        <UPagination
          :default-page="1"
          :page="page"
          :items-per-page="TRANSACTIONS_PER_PAGE"
          :total="totalTransactions"
          :to="to"
          :sibling-count="2"
        />
      </template>
    </UDashboardPanel>
    <template #fallback>
      <div class="h-screen flex flex-col justify-center items-center gap-5">
        <UIcon name="svg-spinners:bars-rotate-fade" class="size-5" />
        <div class="text-xs">
          Loading Transactions ...
        </div>
      </div>
    </template>
  </Suspense>
</template>
