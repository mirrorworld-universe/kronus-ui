<script setup lang="ts">
import { useGenesisVault } from "~/composables/queries/useGenesisVault";
import { useMultisig } from "~/composables/queries/useMultisigs";
import { useRefresh } from "~/composables/queries/useRefresh";
import { useTransactions } from "~/composables/queries/useTransactions";
import type { IMultisig } from "~/types/squads";

const route = useRoute();
const toast = useToast();
const router = useRouter();

const { walletAddress, connected } = useWalletConnection();
const isWalletConnected = computed(() => !!walletAddress.value && connected.value);
const open = ref(false);

const { genesisVault, treasuryAccounts: treasuryAccountsFallback } = await useGenesisVault();
const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));

const multisig = computed(() => useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value).data.value);

const { refresh: refreshMultisig } = useRefresh(MULTISIG_QUERY_KEY);

watch(() => MULTISIG_QUERY_KEY.value, async (newMultisigQueryKey, oldMultisigQueryKey) => {
  if (newMultisigQueryKey !== oldMultisigQueryKey) {
    console.debug("genesis vault changed. invalidating multisig query data...");
    await refreshMultisig(async () => {
      await useAsyncData(newMultisigQueryKey, () => $fetch(`/api/multisigs/${genesisVault.value}`));
    });
  }
});

const multisigAddress = computed(() => multisig.value?.id || "");
const { data: _ } = await useMultisig(multisigAddress);

const CURRENT_MULTISIG_QUERY_KEY = computed(() => keys.vaults(multisigAddress.value));

const treasuryAccounts = computed(() => (useNuxtData<{
  created_at: string | null;
  multisig_id: string;
  name: string;
  public_key: string;
  vault_index: number;
}[]>(CURRENT_MULTISIG_QUERY_KEY.value).data.value!) || treasuryAccountsFallback.value);

const { TRANSACTIONS_PAGE_QUERY_KEY, transactions } = await useTransactions();

const pendingTransactionsCount = computed(() => transactions.value.filter(tx => tx.proposal?.status.__kind === "Active").length);
const isTreasuryActiveRoute = computed(() => route.path === `/squads/${genesisVault.value}/treasury`);

const isTreasuryCollapsed = ref(true);
const links = computed(() => [[{
  label: "Dashboard",
  icon: "i-lucide-layout-dashboard",
  to: `/squads/${genesisVault.value}/home`,
  onSelect: () => {
    open.value = false;
  }
},
{
  label: "Transactions",
  icon: "i-lucide-zap",
  to: `/squads/${genesisVault.value}/transactions`,
  badge: pendingTransactionsCount.value,
  onSelect: () => {
    open.value = false;
  }
},
{
  label: "Members",
  to: `/squads/${genesisVault.value}/members`,
  icon: "i-lucide-users",
  onSelect: () => {
    open.value = false;
  }
},
{
  label: "Treasury",
  icon: "i-lucide-wallet-cards",
  to: `/squads/${genesisVault.value}/treasury`,
  type: "link",
  as: "a",
  class: isTreasuryActiveRoute.value ? `text-(--ui-primary) hover:text-(--ui-primary) before:bg-(--ui-bg-elevated) [&>span.iconify]:text-(--ui-primary)` : undefined,
  onSelect: (e: Event) => {
    e.preventDefault();
    open.value = false;
    router.push(`/squads/${genesisVault.value}/treasury`);
  },
  open: isTreasuryCollapsed.value,
  defaultOpen: true,
  children: treasuryAccounts.value?.map(account => ({
    label: account.name.length > 20 ? `${account.name.slice(0, 20)}...` : account.name,
    to: `/squads/${genesisVault.value}/treasury/${account.public_key}`,
    icon: "line-md:security",
    onSelect: () => {
      open.value = false;
    }
  })) || [],
},

], [{
  label: "Feedback",
  icon: "i-lucide-message-circle",
  to: "https://github.com/nuxt-ui-pro/dashboard",
  target: "_blank"
}, {
  label: "Help & Support",
  icon: "i-lucide-info",
  to: "https://github.com/nuxt/ui-pro",
  target: "_blank"
}]]);

const groups = computed(() => [{
  id: "links",
  label: "Go to",
  items: links.value.flat()
}, {
  id: "code",
  label: "Code",
  items: [{
    id: "source",
    label: "View page source",
    icon: "i-simple-icons-github",
    to: `https://github.com/nuxt-ui-pro/dashboard/blob/main/app/pages${route.path === "/" ? "/index" : route.path}.vue`,
    target: "_blank"
  }]
}]);

const { refresh } = useRefresh(TRANSACTIONS_PAGE_QUERY_KEY);

onMounted(async () => {
  emitter.on("transactions:refresh", refresh);

  const cookie = useCookie("cookie-consent");
  if (cookie.value === "accepted") {
    return;
  }

  toast.add({
    title: "We use first-party cookies to enhance your experience on our website.",
    duration: 0,
    close: false,
    actions: [{
      label: "Accept",
      color: "neutral",
      variant: "outline",
      onClick: () => {
        cookie.value = "accepted";
      }
    }, {
      label: "Opt out",
      color: "neutral",
      variant: "ghost"
    }]
  });
});
</script>

<template>
  <Suspense>
    <UDashboardGroup unit="rem">
      <template v-if="isWalletConnected">
        <UDashboardSidebar
          id="default"
          v-model:open="open"
          collapsible
          resizable
          class="bg-(--ui-bg-elevated)/25"
          :ui="{ footer: 'lg:border-t lg:border-(--ui-border)' }"
        >
          <template #header="{ collapsed }">
            <MultisigsMenu :collapsed="collapsed" />
          </template>

          <template #default="{ collapsed }">
            <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-(--ui-border)" />

            <UNavigationMenu
              :collapsed="collapsed"
              :items="links[0] as any"
              orientation="vertical"
            />

            <UNavigationMenu
              :collapsed="collapsed"
              :items="links[1] as any"
              orientation="vertical"
              class="mt-auto"
            />
          </template>

          <template #footer="{ collapsed }">
            <UserMenu :collapsed="collapsed" />
          </template>
        </UDashboardSidebar>

        <UDashboardSearch :groups="groups" />

        <slot />

        <template v-if="multisigAddress">
          <MultisigSendTokensModal :multisig-address="multisigAddress" />
        </template>
      </template>
      <template v-else>
        <HomeConnectWallet />
      </template>
    </UDashboardGroup>

    <template #fallback>
      <div class="h-screen flex flex-col justify-center items-center gap-5 w-full">
        <UIcon name="svg-spinners:bars-rotate-fade" />
      </div>
    </template>
  </Suspense>
</template>
