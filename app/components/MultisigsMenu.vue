<script setup lang="ts">
defineProps<{
  collapsed?: boolean;
}>();

const route = useRoute();
const router = useRouter();

const multisigParam = computed(() => route.params?.multisig as unknown as string);

const { walletAddress } = useWalletConnection();
const { data: multisigs } = await useFetch(`/api/multisigs/${walletAddress.value}`, {
});

const multisigsList = computed(() => (multisigs.value || []));
const selectedMultisig = computed(() => multisigsList.value.find(multisig => multisig.id === multisigParam.value));

const items = computed(() => {
  return [multisigsList.value.map(multisig => ({
    ...multisig,
    label: multisig.name,
    async onSelect() {
      await router.push(`/${multisig.id}/home`);
    }
  })), [{
    label: "Create new multisig",
    icon: "i-lucide-circle-plus"
  }]];
});
</script>

<template>
  <UDropdownMenu
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
