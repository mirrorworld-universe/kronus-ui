<script setup lang="ts">
import { useGenesisVault } from "~/composables/queries/useGenesisVault";
import { useRefresh } from "~/composables/queries/useRefresh";
import type { IMultisig } from "~/types/squads";

defineProps<{
  collapsed?: boolean;
}>();

const router = useRouter();

const { genesisVault } = await useGenesisVault();
const { walletAddress } = await useWalletConnection();
const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const MULTISIGS_BY_MEMBER_QUERY_KEY = computed(() => keys.multisigsByMember(walletAddress.value!));

await useAsyncData(MULTISIG_QUERY_KEY.value, () => $fetch(`/api/multisigs/${genesisVault.value}`));

const { data: multisigs } = await useNuxtData<IMultisig[]>(MULTISIGS_BY_MEMBER_QUERY_KEY.value);
const currentMultisig = computed(() => useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value).data.value);

const { refresh: refreshMultisig } = useRefresh(MULTISIG_QUERY_KEY);

watch(() => MULTISIG_QUERY_KEY.value, async (newMultisigQueryKey, oldMultisigQueryKey) => {
  if (newMultisigQueryKey !== oldMultisigQueryKey) {
    console.debug("genesis vault changed. invalidating multisig query data...");
    await refreshMultisig(async () => {
      await useAsyncData(newMultisigQueryKey, () => $fetch(`/api/multisigs/${genesisVault.value}`));
    });
  }
}, {
  flush: "pre"
});

const CREATE_NEW_MULTISIG_ITEM = reactive({
  icon: "i-lucide-circle-plus",
  label: "Create squad",
  name: "Create squad",
  to: "/create",
});
const IMPORT_MULTISIG_ITEM = reactive({
  icon: "line-md:downloading-loop",
  label: "Import multisig",
  name: "Import multisig",
  to: "/import",
});

const multisigsList = computed(() => (multisigs.value || []));
const selectedMultisig = computed(() => currentMultisig.value);

const items = computed(() => {
  return [multisigsList.value.map(multisig => ({
    ...multisig,
    label: multisig.name,
    async onSelect() {
      await router.push(`/squads/${multisig.first_vault}/home`);
    }
  })), [CREATE_NEW_MULTISIG_ITEM, IMPORT_MULTISIG_ITEM]];
});
</script>

<template>
  <div class="w-full">
    <template v-if="!multisigsList.length">
      <UButton
        v-bind="{
          ...CREATE_NEW_MULTISIG_ITEM
        }"
        color="neutral"
        variant="outline"
        block
        :square="collapsed"
        class="data-[state=open]:bg-(--ui-bg-elevated) justify-start px-3"
        :class="[!collapsed && 'py-2']"
      >
        Create Squad
      </UButton>
      <UButton
        v-bind="{
          ...IMPORT_MULTISIG_ITEM
        }"
        color="neutral"
        variant="outline"
        block
        :square="collapsed"
        class="data-[state=open]:bg-(--ui-bg-elevated) justify-start px-3"
        :class="[!collapsed && 'py-2']"
      >
        Import Squad
      </UButton>
    </template>
    <UDropdownMenu
      v-else
      :items="items"
      :content="{ align: 'center', collisionPadding: 12 }"
      :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <UButton
        v-bind="{
          ...selectedMultisig,
          label: collapsed ? undefined : selectedMultisig?.name,
          trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
        }"
        color="neutral"
        variant="ghost"
        block
        :square="collapsed"
        class="data-[state=open]:bg-(--ui-bg-elevated)"
        :class="[!collapsed && 'py-2']"
        :ui="{
          trailingIcon: 'text-(--ui-text-dimmed)'
        }"
      />
    </UDropdownMenu>
  </div>
</template>
