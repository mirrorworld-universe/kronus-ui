<script setup lang="ts">
const route = useRoute();
const toast = useToast();

const open = ref(false);

const activeMultisig = computed(() => route.params?.genesis_vault as unknown as string);

const links = computed(() => [[{
  label: "Dashboard",
  icon: "i-lucide-layout-dashboard",
  to: `/squads/${activeMultisig.value}/home`,
  onSelect: () => {
    open.value = false;
  }
},
{
  label: "Transactions",
  icon: "i-lucide-zap",
  to: `/squads/${activeMultisig.value}/transactions`,
  badge: "4",
  onSelect: () => {
    open.value = false;
  }
},
{
  label: "Members",
  to: `/squads/${activeMultisig.value}/members`,
  icon: "i-lucide-users",
  onSelect: () => {
    open.value = false;
  }
},

{
  label: "Treasury",
  icon: "i-lucide-wallet-cards",
  to: `/squads/${activeMultisig.value}/treasury`,
  onSelect: () => {
    open.value = false;
  }
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

onMounted(async () => {
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
          :items="links[0]"
          orientation="vertical"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
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
  </UDashboardGroup>
</template>
