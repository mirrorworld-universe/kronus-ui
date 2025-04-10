import { Buffer } from "buffer";
import SolanaWallets from "solana-wallets-vue";
import "solana-wallets-vue/styles.css";
import { NightlyWalletAdapter } from "@solana/wallet-adapter-wallets";

// @ts-expect-error - Buffer is needed for Solana wallet functionality
globalThis.Buffer = globalThis.Buffer || Buffer;

const walletOptions = {
  wallets: [
    new BackpackWalletAdapter(),
    new NightlyWalletAdapter(),
  ],
  autoConnect: true,
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SolanaWallets, walletOptions);
});
