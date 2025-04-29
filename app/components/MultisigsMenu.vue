<script setup lang="ts">
defineProps<{
  collapsed?: boolean;
}>();

const route = useRoute();
const router = useRouter();

const multisigParam = computed(() => route.params?.genesis_vault as unknown as string);

const { walletAddress } = useWalletConnection();
const { data: multisigs, refresh } = await useFetch(`/api/multisigs/creator/${walletAddress.value}`);
const { data: currentMultisig } = await useFetch(`/api/multisigs/${multisigParam.value}`);

const CREATE_NEW_MULTISIG_ITEM = reactive({
  icon: "i-lucide-circle-plus",
  label: "Create squad",
  name: "Create squad",
  to: "/create",
});

const multisigsList = computed(() => (multisigs.value || []));
const selectedMultisig = computed(() => currentMultisig.value);

const items = computed(() => {
  return [multisigsList.value.map(multisig => ({
    ...multisig,
    label: multisig.name,
    async onSelect() {
      await router.push(`/squads/${multisig.id}/home`);
    }
  })), [CREATE_NEW_MULTISIG_ITEM]];
});

emitter.on("multisigs:refresh", refresh);
</script>

<template>
  <UButton
    v-if="!multisigsList.length"
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
</template>
