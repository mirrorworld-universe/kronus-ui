<script setup lang="ts">
import type * as multisig from "@sqds/multisig";
import type { CheckboxGroupItem, CheckboxGroupValue } from "@nuxt/ui";
import WalletConnectButton from "~/components/WalletConnectButton.vue";
import type { IMultisig, IMember } from "~/types/squads";

defineRouteRules({
  ssr: false
});

const route = useRoute();

const genesisVault = computed(() => route.params.genesis_vault as string);
const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
const { data: __multisig } = await useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);

const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(__multisig.value!.id));
const { data: onchainMultisig } = useNuxtData<multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value);

const members = computed<IMember[]>(() => {
  if (!onchainMultisig.value?.members) return [];
  return onchainMultisig.value.members.map(member => ({
    mask: member.permissions.mask,
    public_key: member.key.toBase58(),
    roles: memberToRoles(member)
  }));
});

const { isMultisigMember, userCanPropose } = await useAuthorize();

const userIsUnauthorized = computed(() => !isMultisigMember.value || !userCanPropose.value);

const toast = useToast();

const open = ref(false);
const newSquadMemberAddress = ref("");

const roleItems = ref<CheckboxGroupItem[]>([
  {
    label: "Proposer",
    value: "1",
  },
  {
    label: "Voter",
    value: "2",
  },
  {
    label: "Executor",
    value: "4",
  }
]);
// Be default we select all
const rolesValue = ref<CheckboxGroupValue[]>(["1", "2", "4"]);

function handleAddMember() {
  console.log("user clicked add member");
  toast.add({
    description: "Add member coming soon",
    color: "info",
  });
}
</script>

<template>
  <UDashboardPanel id="members">
    <template #header>
      <UDashboardNavbar title="Members" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-semibold">
              Members
            </h3>

            <UModal
              v-model:open="open"
              title="Add new member"
              description="Add a new member to your multisig or squad."
              :ui="{ footer: 'justify-end' }"
            >
              <UButton :disabled="userIsUnauthorized" leading-icon="line-md:person-add">
                Add member
              </UButton>

              <template #body>
                <div class="flex flex-col gap-5 *:not-last:after:absolute *:not-last:after:inset-x-1 *:not-last:after:bottom-0 *:not-last:after:bg-border *:not-last:after:h-px">
                  <UFormField label="New member address" required class="w-full">
                    <UInput
                      v-model="newSquadMemberAddress"
                      class="w-full"
                      size="lg"
                      placeholder="Enter new member address"
                    />
                  </UFormField>

                  <div class="border-b border-neutral-700" />

                  <UCheckboxGroup
                    v-model="rolesValue"
                    orientation="horizontal"
                    value-key="value"
                    color="neutral"
                    :items="roleItems"
                  >
                    <template #legend>
                      <div class="flex gap-3 items-center">
                        <span>Permissions</span>
                      </div>
                    </template>
                  </UCheckboxGroup>

                  <div class="border-b border-neutral-700" />

                  <UAlert
                    class="bg-transparent w-full px-0 opacity-50"
                    :ui="{
                      description: 'text-xs'
                    }"
                    color="neutral"
                    variant="soft"
                    description="Only add wallets that you fully control. Do not add CEX addresses, as they can't be used to sign transactions."
                    icon="i-lucide-info"
                  />
                </div>
              </template>

              <template #footer>
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="outline"
                  @click="open = false"
                />
                <UButton label="Add member" color="primary" @click="handleAddMember" />
              </template>
            </UModal>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <MultisigMemberCard v-for="member in members" :key="`member-${member.public_key}`" :member="member" />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
