import { ref, onUnmounted } from "vue";
import type { Connection } from "@solana/web3.js";
import { connectionManager } from "~/utils/connection.manager";

export function useConnection() {
  const connection = ref<Connection>(connectionManager.getCurrentConnection());

  onUnmounted(() => {
    connectionManager.cleanup();
  });

  return {
    connection,
    getCurrentConnection: () => connectionManager.getCurrentConnection()
  };
}
