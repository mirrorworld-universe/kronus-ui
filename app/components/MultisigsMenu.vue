<script setup lang="ts">
import { useGenesisVault } from "~/composables/queries/useGenesisVault";
import type { IMultisig } from "~/types/squads";

defineProps<{
  collapsed?: boolean;
}>();

const router = useRouter();

const { genesisVault } = await useGenesisVault();
const { walletAddress } = await useWalletConnection();
const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const MULTISIGS_BY_MEMBER_QUERY_KEY = computed(() => keys.multisigsByMember(walletAddress.value!));

const { data: multisigs } = await useNuxtData<IMultisig[]>(MULTISIGS_BY_MEMBER_QUERY_KEY.value);
const { data: currentMultisig } = await useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);

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
      await router.push(`/squads/${multisig.first_vault}/home`);
    }
  })), [CREATE_NEW_MULTISIG_ITEM]];
});
</script>

<template>
  <div class="w-full">
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
  </div>
</template>
