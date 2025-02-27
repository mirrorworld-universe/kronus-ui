<template>
  <div class="multisig-dashboard">
    <div class="header">
      <h1>Multisig Dashboard</h1>
      <button @click="createNewMultisig" :disabled="!wallet.connected">
        Create Multisig
      </button>
    </div>

    <div v-if="loading" class="loading">Loading multisigs...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="multisigs.length === 0" class="empty-state">
      No multisigs found. Create your first multisig to get started.
    </div>

    <div v-else class="multisig-list">
      <div
        v-for="multisig in multisigs"
        :key="multisig.address.toString()"
        class="multisig-card"
      >
        <h2>{{ multisig.name || "Unnamed Multisig" }}</h2>
        <p>{{ multisig.description || "No description" }}</p>
        <div class="details">
          <p>
            Threshold: {{ multisig.threshold }} of {{ multisig.members.length }}
          </p>
          <p>Transactions: {{ multisig.transactionCount }}</p>
        </div>
        <button @click="viewMultisig(multisig)">View Details</button>
      </div>
    </div>

    <!-- Modals for creating multisig, viewing details, etc. -->
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useWallet } from "@solana/wallet-adapter-vue";
import { useSquads } from "../hooks/useSquads";

const wallet = useWallet();
const { multisigs, loading, error, loadMultisigs } = useSquads();

onMounted(() => {
  if (wallet.connected.value) {
    loadMultisigs();
  }
});

const createNewMultisig = () => {
  // Open modal for creating new multisig
};

const viewMultisig = (multisig) => {
  // Navigate to multisig details page or open modal
};
</script>

<style scoped>
/* Add your styling here */
</style>
