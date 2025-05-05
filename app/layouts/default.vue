<script setup lang="ts">
import { useMultisig } from "~/composables/queries/useMultisigs";
import { useRefresh } from "~/composables/queries/useRefresh";
import { useTransactions } from "~/composables/queries/useTransactions";

const route = useRoute();
const toast = useToast();

const open = ref(false);

const { walletAddress } = useWalletConnection();
await useAsyncData(keys.multisigsByMember(walletAddress.value!), () => $fetch(`/api/multisigs/creator/${walletAddress.value}`));

const genesisVault = computed(() => route.params?.genesis_vault as unknown as string);
const { data: multisig } = await useAsyncData(keys.multisig(genesisVault.value), () => $fetch(`/api/multisigs/${genesisVault.value}`));
const multisigAddress = computed(() => multisig.value!.id);
const { data: treasuryAccounts } = await useAsyncData(keys.vaults(multisigAddress.value), () => $fetch(`/api/vaults/${multisigAddress.value}`));
await useMultisig(multisigAddress);
const router = useRouter();

const { TRANSACTIONS_PAGE_QUERY_KEY } = await useTransactions();

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
  badge: "4",
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
  // {
  //   label: "Members",
  //   to: "/settings/members",
  //   icon: "i-lucide-users",
  //   onSelect: () => {
  //     open.value = false;
  //   }
  // }, {
  //   label: "Settings",
  //   to: "/settings",
  //   icon: "i-lucide-settings",
  //   defaultOpen: true,
  //   children: [{
  //     label: "General",
  //     to: "/settings",
  //     exact: true,
  //     onSelect: () => {
  //       open.value = false;
  //     }
  //   }]
  // }

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
  <UDashboardGroup unit="rem">
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

    <NotificationsSlideover />
    <MultisigSendTokensModal :multisig-address="multisigAddress" />
  </UDashboardGroup>
</template>
