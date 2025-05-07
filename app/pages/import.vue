<script setup lang="ts">
import { PublicKey } from "@solana/web3.js";
import type { StepperItem } from "@nuxt/ui";
import * as multisig from "@sqds/multisig";
import WalletConnectButton from "~/components/WalletConnectButton.vue";

const { Multisig } = multisig.accounts;
defineRouteRules({
  ssr: false
});

definePageMeta({
  layout: "create"
});

const router = useRouter();

const isLoading = ref(false);

const toast = useToast();

const items = ref<StepperItem[]>([
  {
    // title: "Address",
    description: "Searching the network for your Multisig.",
    icon: "line-md:search"
  },
  {
    // title: "Shipping",
    description: "Querying for funded vaults. Max (10)",
    icon: "ph:vault-bold"
  },
  {
    // title: "Checkout",
    description: "Indexing accounts",
    icon: "oui:index-edit"
  },
  {
    // title: "Checkout",
    description: "Finished!",
    icon: "line-md:check-all"
  }
]);

const stepper = useTemplateRef("stepper");

const multisigAddress = ref("");
const multisigName = ref("");

const importedMultisigData = ref();

const { walletAddress } = useWalletConnection();

const isDone = computed(() => !!importedMultisigData.value && !isLoading.value);

function reset() {
  importedMultisigData.value = undefined;
  multisigAddress.value = "";
  multisigName.value = "";
  isLoading.value = false;
}

function finish() {
  router.push(`/squads/${importedMultisigData.value.created_multisig.first_vault}/home`);
  reset();
}

async function importMultisig() {
  try {
    isLoading.value = true;

    if (multisigAddress.value.trim() === "") throw new Error("Multisig Address is empty");
    if (multisigName.value.trim() === "") throw new Error("Multisig name is empty");

    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigAddress.value)
    );

    if (!multisigAccount) throw new Error("Multisig account not found. Please ensure that the address is a Multisig PDA");

    stepper.value?.next();

    const multisig = multisigAccount.pretty();

    if (!walletAddress.value) throw new Error("Wallet not connected.");

    // Ensure that member is connection
    const isMember = multisig.members.map(keys => keys.key.toBase58()).includes(walletAddress.value);

    if (!isMember) throw new Error(`This wallet is not a member of squad ${multisigAddress.value}`);

    // Query funded vaults.
    const foundVaults = await listMultisigVaults(
      new PublicKey(multisigAddress.value)
    );

    const foundVaultsPromises = foundVaults.map(async (vault) => {
      const balance = await connection.getBalance(vault.vaultAccount);
      return {
        vault,
        vaultIndex: vault.vaultIndex,
        balance
      };
    });

    const multisigPda = new PublicKey(multisigAddress.value);

    const foundVaultsWithBalances = await Promise.all(foundVaultsPromises);
    console.log("foundVaultsWithBalances", foundVaultsWithBalances);

    const fundedVaults = (foundVaultsWithBalances).filter((vault, index) => (index === 0) || (vault.balance > 0));

    const fundedVaultsPayload = fundedVaults.map((v, i) => ({
      multisig_id: multisigPda.toBase58(),
      vault_index: v.vaultIndex,
      public_key: v.vault.vaultAccount.toBase58(),
      name: `Vault Account ${i}`
    }));

    // Store multisig and vaults.

    stepper.value?.next();

    const importedMultisig = await $fetch("/api/import", {
      method: "POST",
      body: {
        address: multisigPda.toBase58(),
        creator_address: multisig.members[0]!.key.toBase58(),
        create_key: multisig.createKey,
        first_vault: fundedVaultsPayload[0]?.public_key,
        name: multisigName.value,
        description: `Imported Multisig - ${Date.now()}`,
        created_at: Math.floor(Date.now() / 1000),
        members: multisig.members.map(m => ({
          address: m.key.toBase58(),
          permissions: m.permissions
        })),
        threshold: multisig.threshold,
        vaults: fundedVaultsPayload
      }
    });

    stepper.value?.next();
    console.log("Imported Multisig Successfully", importedMultisig);

    const firstVaultPublicKey = fundedVaultsPayload[0]!.public_key;

    toast.add({
      description: `Successfully imported your multisig!`,
      actions: [{
        icon: "i-lucide-eye",
        label: "Go to vault",
        color: "success",
        variant: "outline",
        onClick: (e) => {
          e?.stopPropagation();
          navigator.clipboard.writeText(multisigPda.toBase58());
          router.push(`/squads/${firstVaultPublicKey}/treasury`);
        }
      }]
    });

    importedMultisigData.value = importedMultisig;
  } catch (error: any) {
    console.error("Failed to store multisig data:", error);
    toast.add({
      description: error.message,
      color: "error"
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="import">
    <template #header>
      <UDashboardNavbar title="Import A Multisig" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WalletConnectButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-8 h-full px-4 pt-8 pb-16 justify-start items-center sm:gap-12">
        <UCard class="min-w-lg">
          <template #header>
            <h3 class="font-semibold text-lg">
              Import Your Multisig to Kronus
            </h3>
          </template>

          <div class="flex flex-col gap-4 items-start justify-start min-w-sm w-full">
            <UFormField class="w-full" label="Multisig Address" required>
              <UInput
                v-model="multisigAddress"
                class="w-full"
                size="lg"
                placeholder="Enter your multisig public key"
              />
            </UFormField>
            <UFormField class="w-full" label="Name" required>
              <UInput
                v-model="multisigName"
                class="w-full"
                size="lg"
                placeholder="Enter a name for your multisig"
              />
            </UFormField>

            <UButton :disabled="isDone" :loading="isLoading" @click="importMultisig">
              Import Multisig
            </UButton>
          </div>

          <template #footer>
            <div class="flex flex-col gap-4 items-start justify-start min-w-sm w-full">
              <UStepper
                ref="stepper"
                :default-value="-1"
                linear
                size="sm"
                orientation="vertical"
                :items="items"
                class="w-full"
              />

              <div class="flex justify-end items-center gap-3 w-full">
                <UButton
                  color="neutral"
                  variant="ghost"
                  :disabled="!isLoading"
                  :loading="isLoading"
                  @click="reset"
                >
                  Retry
                </UButton>
                <UButton color="neutral" :disabled="!importedMultisigData" @click="finish">
                  Finish
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
