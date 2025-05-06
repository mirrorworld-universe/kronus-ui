<script setup lang="ts">
import TransactionsTable from "~/components/multisig/TransactionsTable.vue";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import { useTransactions } from "~/composables/queries/useTransactions";

defineRouteRules({
  ssr: false
});

const { transactions, page, goToPage: to, totalPages, multisigAddress, TRANSACTIONS_PAGE_QUERY_KEY } = await useTransactions();
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
        <TransactionsTable :multisig-pda="multisigAddress" :transactions="transactions" :transactions-query-key="TRANSACTIONS_PAGE_QUERY_KEY" />
        <UPagination
          :model-value="page"
          :total="totalPages"
          :to="to"
          :sibling-count="2"
        />
      </template>
    </UDashboardPanel>
    <template #fallback>
      <div class="h-full flex justify-center items-center">
        <UIcon name="svg-spinners:bars-rotate-fade" />
      </div>
    </template>
  </Suspense>
</template>
