<script setup lang="ts">
import WalletModal from "./WalletModal.vue";
import { useWalletConnection } from "~/composables/useWalletConnection";

const {
  walletAddress,
  connected,
  // connectWallet,
  disconnectWallet,
  openModal,
  copyAddress
} = useWalletConnection();

const truncatedAddress = computed(() => {
  if (!walletAddress.value) return "";
  return `${walletAddress.value.slice(0, 4)}...${walletAddress.value.slice(
    -4
  )}`;
});

const dropdownItems = [[
  {
    label: "Copy address",
    icon: "i-heroicons-clipboard",
    onSelect: copyAddress
  },
  {
    label: "Change wallet",
    icon: "i-heroicons-arrows-right-left",
    onSelect: openModal
  },
  {
    label: "Disconnect",
    icon: "i-heroicons-power",
    onSelect: disconnectWallet
  }
]];
</script>

<template>
  <div>
    <UButton
      v-if="!connected"
      color="primary"
      @click="openModal"
    >
      <UIcon
        name="i-heroicons-wallet"
        class="mr-2"
      />
      Connect Wallet
    </UButton>

    <UDropdownMenu
      v-else
      :items="dropdownItems"
    >
      <UButton icon="i-heroicons-wallet" color="primary" variant="outline">
        {{ truncatedAddress }}
      </UButton>
    </UDropdownMenu>

    <WalletModal />
  </div>
</template>
