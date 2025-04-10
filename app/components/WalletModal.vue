<script setup lang="ts">
import { useWalletConnection } from "~/composables/useWalletConnection";

const { isModalOpen, closeModal, availableWallets, connectWallet } = useWalletConnection();
</script>

<template>
  <UModal
    v-model:open="isModalOpen"
    description="Connect your wallet to get started with Kronus"
  >
    <template #content>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">
            Connect Wallet
          </h2>
          <UButton
            color="primary"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
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
</template>
