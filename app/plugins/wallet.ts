import SolanaWallets from "solana-wallets-vue";
import "solana-wallets-vue/styles.css";
import { NightlyWalletAdapter } from "@solana/wallet-adapter-wallets";

const walletOptions = {
  wallets: [
    new BackpackWalletAdapter(),
    new NightlyWalletAdapter(),
  ],
  autoConnect: false,
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SolanaWallets, walletOptions);
});
