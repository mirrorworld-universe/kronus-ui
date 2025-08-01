<script setup lang="ts">
import WalletConnectButton from "~/components/WalletConnectButton.vue";
</script>

<template>
  <UContainer>
    <UCard variant="soft">
      <template #header>
        <h3 class="text-2xl font-semibold">
          Multisig Not Found
        </h3>
      </template>
      <div class="text-center py-12">
        <div class="mx-auto max-w-md">
          <div class="flex justify-center mb-6">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-orange-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Multisig Not Found
          </h3>
          <p class="text-gray-600 mb-6">
            The multisig you're looking for could not be found. It may have been deleted or you may not have the correct permissions to view it.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <UButton
              to="/"
              variant="solid"
              color="primary"
            >
              Go to Home
            </UButton>
            <UButton
              to="/create"
              variant="outline"
              color="gray"
            >
              Create New Multisig
            </UButton>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="h-4" />
      </template>
    </UCard>
  </UContainer>
</template>