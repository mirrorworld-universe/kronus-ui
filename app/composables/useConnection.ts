import { ref, onUnmounted } from "vue";
import type { Connection } from "@solana/web3.js";
import { connectionManager } from "~/utils/connection.manager";
import type { Network } from "~/utils/constants";

export function useConnection() {
  const connection = ref<Connection>(connectionManager.getCurrentConnection());
  const network = ref<Network>(connectionManager.getNetwork());

  onUnmounted(() => {
    connectionManager.cleanup();
  });

  const setNetwork = (newNetwork: Network) => {
    connectionManager.setNetwork(newNetwork);
    network.value = newNetwork;
    connection.value = connectionManager.getCurrentConnection();
  };

  return {
    connection,
    network,
    getCurrentConnection: () => connectionManager.getCurrentConnection(),
    setNetwork
  };
}
