import { ref, onMounted, type Ref } from "vue";
import { useWallet } from "@solana/wallet-adapter-vue";
import { useConnection } from "@solana/wallet-adapter-vue";
import { initSquadsClient, getMultisigs } from "../lib/squads";
import type { MultisigInfo } from "../lib/squads/types";

export function useSquads() {
  const { wallet, publicKey } = useWallet();
  const { connection } = useConnection();

  const squadsClient = ref(null);
  const multisigs: Ref<MultisigInfo[]> = ref([]);
  const loading = ref(false);
  const error = ref(null);

  onMounted(async () => {
    if (connection.value && wallet.value) {
      squadsClient.value = initSquadsClient(connection.value, wallet.value);
    }
  });

  const loadMultisigs = async () => {
    if (!squadsClient.value || !publicKey.value) {
      error.value = "Client or wallet not initialized";
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      multisigs.value = await getMultisigs(squadsClient.value, publicKey.value);
    } catch (err) {
      error.value = err.message || "Failed to load multisigs";
    } finally {
      loading.value = false;
    }
  };

  // Add more functions for proposal creation, approval, etc.

  return {
    squadsClient,
    multisigs,
    loading,
    error,
    loadMultisigs,
  };
}
