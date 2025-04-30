import { computed, ref } from "vue";
import { useWallet } from "solana-wallets-vue";
import type { WalletName } from "@solana/wallet-adapter-base";
import type * as multisig from "@sqds/multisig";
import { SUPPORTED_WALLETS } from "~/utils/constants";
import type { IMultisig } from "~/types/squads";

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

export async function useAuthorize() {
  const { walletAddress } = useWalletConnection();

  const route = useRoute();

  const genesisVault = computed(() => route.params.genesis_vault as string);
  const MULTISIG_QUERY_KEY = computed(() => keys.multisig(genesisVault.value));
  const { data: __multisig } = await useNuxtData<IMultisig>(MULTISIG_QUERY_KEY.value);

  const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(__multisig.value!.id));
  const { data: onchainMultisig } = useNuxtData<multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value);

  const members = computed(() => {
    if (!onchainMultisig.value?.members) return [];
    return onchainMultisig.value.members.map(member => ({
      mask: member.permissions.mask,
      public_key: member.key.toBase58(),
      roles: memberToRoles(member)
    }));
  });

  const isMultisigMember = computed(() => {
    if (!walletAddress.value || !members.value) return false;
    return members.value.some(member => member.public_key === walletAddress.value);
  });

  const userCanPropose = computed(() => {
    if (!walletAddress.value || !members.value) return false;
    return members.value.some(member =>
      member.public_key === walletAddress.value
      && member.roles.includes("Proposer")
    );
  });

  const userCanVote = computed(() => {
    if (!walletAddress.value || !members.value) return false;
    return members.value.some(member =>
      member.public_key === walletAddress.value
      && member.roles.includes("Voter")
    );
  });
  const userCanExecute = computed(() => {
    if (!walletAddress.value || !members.value) return false;
    return members.value.some(member =>
      member.public_key === walletAddress.value
      && member.roles.includes("Executor")
    );
  });

  const isAlmightyUser = computed(() => {
    if (!walletAddress.value || !members.value) return false;
    return members.value.some(member =>
      member.public_key === walletAddress.value
      && member.roles.includes("Proposer")
      && member.roles.includes("Voter")
      && member.roles.includes("Executor")
    );
  });

  return {
    isMultisigMember,
    userCanPropose,
    userCanVote,
    userCanExecute,
    isAlmightyUser
  };
}
