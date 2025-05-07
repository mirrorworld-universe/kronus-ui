<script setup lang="ts">
const { isModalOpen, closeModal, availableWallets, connectWallet } = useWalletConnection();
</script>

<template>
  <div class="flex flex-col justify-center items-center gap-5 w-full">
    <!-- <h4 class="text-xl font-bold text-warning">
      Wallet Not Nonnected
    </h4> -->
    <div class="text-neutral">
      Please connect your wallet to continue using Kronus.
    </div>

    <UModal
      v-model:open="isModalOpen"
      description="Connect your wallet to get started with Kronus"
    >
      <UButton size="lg" icon="i-heroicons-wallet">
        Connect Wallet
      </UButton>
      <template #content>
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold">
              Connect Wallet
            </h2>
          </div>

          <div class="space-y-3">
            <div
              v-for="wallet in availableWallets"
              :key="wallet.name"
              class="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors px-4 py-3 rounded-md"
              @click="connectWallet(wallet.name)"
            >
              <div class="flex items-center justify-between gap-8">
                <div class="flex items-center space-x-3">
                  <img
                    v-if="wallet.icon"
                    :src="wallet.icon"
                    :alt="wallet.name"
                    class="w-8 h-8"
                  >
                  <span class="font-medium">{{ wallet.name }}</span>
                </div>
                <span
                  class="text-sm"
                  :class="wallet.detected ? 'text-green-600' : 'text-gray-500'"
                >
                  {{ wallet.detected ? 'Detected' : 'Not detected' }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <UButton
              color="neutral"
              variant="outline"
              block
              @click="closeModal"
            >
              Cancel
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
