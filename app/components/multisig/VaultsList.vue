<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@/composables/useConnection";
import { listMultisigVaults, type VaultInfo } from "~/utils/multisig";

const props = defineProps<{
  multisigAddress: string;
}>();

const { connection } = useConnection();
const solanaConnection = computed(() => connection.value as Connection);
const vaults = ref<VaultInfo[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchVaults = async () => {
  loading.value = true;
  error.value = null;
  try {
    const multisigPk = new PublicKey(props.multisigAddress);
    vaults.value = await listMultisigVaults(solanaConnection.value, multisigPk);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch vaults";
  } finally {
    loading.value = false;
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
      <UCard v-for="vault in vaults" :key="vault.address.toString()" class="p-4">
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <div class="font-medium">
              {{ vault.name || 'Unnamed Vault' }}
            </div>
            <div class="text-sm text-secondary-100 font-mono">
              {{ vault.address.toString() }}
            </div>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-copy"
            @click="async () => {
              try {
                if (typeof window !== 'undefined') {
                  await window.navigator.clipboard.writeText(vault.address.toString());
                }
              }
              catch (err) {
                console.error('Failed to copy to clipboard:', err);
              }
            }"
          />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-secondary-100">
              Creator
            </div>
            <div class="font-mono">
              {{ vault.creator.toString().slice(0, 8) }}...
            </div>
          </div>
          <div>
            <div class="text-secondary-100">
              Created
            </div>
            <div>{{ new Date(vault.createTime * 1000).toLocaleDateString() }}</div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
