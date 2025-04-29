import { computed, ref } from "vue";
import { useWallet } from "solana-wallets-vue";
import type { WalletName } from "@solana/wallet-adapter-base";
import { SUPPORTED_WALLETS } from "~/utils/constants";

// Make modal state global
const isModalOpen = ref(false);

export const useWalletConnection = () => {
  const { publicKey, connected, connect, disconnect, wallets, select } = useWallet();

  const walletAddress = computed(() => publicKey.value?.toBase58());

  const availableWallets = computed(() =>
    wallets.value
      .filter(wallet => SUPPORTED_WALLETS.includes(wallet.adapter.name as typeof SUPPORTED_WALLETS[number]))
      .map(wallet => ({
        name: wallet.adapter.name,
        icon: wallet.adapter.icon,
        detected: wallet.readyState === "Installed",
        readyState: wallet.readyState
      }))
  );

  const connectWallet = async (walletName?: string) => {
    try {
      if (walletName) {
        await select(walletName as WalletName);
      }
      await connect();
      isModalOpen.value = false;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      throw error;
    }
  };

  const openModal = () => {
    isModalOpen.value = true;
  };

  const closeModal = () => {
    isModalOpen.value = false;
  };

  const copyAddress = () => {
    console.log("walletAddress", walletAddress.value);
    if (walletAddress.value) {
      navigator.clipboard.writeText(walletAddress.value);
    }
  };

  // Sideeffects for when the wallet
  // changes.
  watch(publicKey, () => {
    emitter.emit("multisigs:refresh");
    emitter.emit("treasury:refresh");
    emitter.emit("transactions:refresh");
  });

  return {
    walletAddress,
    connected,
    connectWallet,
    disconnectWallet,
    availableWallets,
    isModalOpen,
    openModal,
    closeModal,
    copyAddress
  };
};
