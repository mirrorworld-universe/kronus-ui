import { PublicKey } from "@solana/web3.js";

export type Network = "mainnet" | "testnet";

export const SUPPORTED_WALLETS = [
  "Backpack",
  "Nightly",
] as const;

export const RPC_CONNECTION_TRANSPORTS = [
  "https://api.mainnet-alpha.sonic.game",
  "https://sonic.helius-rpc.com"
];

export const TESTNET_RPC_CONNECTION_TRANSPORTS = [
  "https://api.testnet.sonic.game/"
];

export const NETWORK_OPTIONS = [
  { label: "Mainnet", value: "mainnet", transports: RPC_CONNECTION_TRANSPORTS },
  { label: "Testnet", value: "testnet", transports: TESTNET_RPC_CONNECTION_TRANSPORTS }
] as const;

// Sonic SVM Squads V4 Program Address
export const SQUADS_V4_PROGRAM_ID = new PublicKey("sqdsFBUUwbsuoLUhoWdw343Je6mvn7dGVVRYCa4wtqJ");

// This program treasury address is an account that is strictly necessary to declare when creating a new multisig address.
// This account is statically initialized when the squads program is deployed. So do not change this.
export const PROGRAM_TREASURY_ACCOUNT = new PublicKey(
  "4KhjyJEhy5ve55t9pdhTKmMTHZDvhzEp3GV2yazwgPzg"
);
