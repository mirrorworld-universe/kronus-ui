<script setup lang="ts">
import { sub } from "date-fns";
import CreateMultisig from "~/components/home/CreateMultisig.vue";
import type { Period, Range } from "~/types";

// const { isNotificationsSlideoverOpen } = useDashboard();

// const items = [[{
//   label: "New mail",
//   icon: "i-lucide-send",
//   to: "/inbox"
// }, {
//   label: "New customer",
//   icon: "i-lucide-user-plus",
//   to: "/customers"
// }]];

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
});
const period = ref<Period>("daily");
</script>

<template>
  <UDashboardPanel id="create">
    <template #header>
      <UDashboardNavbar title="Create New Multisig" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <!-- <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip> -->

          <!-- <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu> -->

          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CreateMultisig />
    </template>
  </UDashboardPanel>
</template>
