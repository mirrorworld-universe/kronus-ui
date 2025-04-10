<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PublicKey } from "@solana/web3.js";
import { listMultisigVaults } from "~/utils/multisig";

const props = defineProps<{
  multisigAddress: string;
}>();

// const { connection } = useConnection();
// const solanaConnection = computed(() => connection.value as Connection);
const vaults = ref<PublicKey[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchVaults = async () => {
  loading.value = true;
  error.value = null;
  try {
    const multisigPk = new PublicKey(props.multisigAddress);
    vaults.value = await listMultisigVaults(multisigPk);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch vaults";
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};

onMounted(() => {
  fetchVaults();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">
        Vaults
      </h2>
      <UButton
        variant="soft"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="fetchVaults"
      >
        Refresh
      </UButton>
    </div>

    <UCard v-if="error" color="red" class="mb-4">
      {{ error }}
    </UCard>

    <div v-if="loading" class="flex justify-center py-8">
      <ULoadingIcon />
    </div>

    <div v-else-if="vaults.length === 0" class="text-center py-8 text-secondary-100">
      No vaults found for this multisig
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="vault in vaults" :key="vault.toString()" class="p-4">
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <div class="font-medium">
              Vault
            </div>
            <div class="text-sm text-secondary-100 font-mono">
              {{ vault.toString() }}
            </div>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-copy"
            @click="copyToClipboard(vault.toString())"
          />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-secondary-100">
              Address
            </div>
            <div class="font-mono">
              {{ vault.toString().slice(0, 8) }}...
            </div>
          </div>
          <div>
            <div class="text-secondary-100">
              Created
            </div>
            <div>Unknown</div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
