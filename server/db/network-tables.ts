import {
  contacts,
  multisigs,
  multisigMembers,
  vaults,
  transactions,
  transactionSignatures,
  testnetContacts,
  testnetMultisigs,
  testnetMultisigMembers,
  testnetVaults,
  testnetTransactions,
  testnetTransactionSignatures,
} from "./schema";

export type Network = "mainnet" | "testnet";

export function getTablesByNetwork(network: Network) {
  switch (network) {
    case "mainnet":
      return {
        contacts,
        multisigs,
        multisigMembers,
        vaults,
        transactions,
        transactionSignatures,
      };
    case "testnet":
      return {
        contacts: testnetContacts,
        multisigs: testnetMultisigs,
        multisigMembers: testnetMultisigMembers,
        vaults: testnetVaults,
        transactions: testnetTransactions,
        transactionSignatures: testnetTransactionSignatures,
      };
    default:
      throw new Error(`Invalid network: ${network}`);
  }
}

export function getNetworkFromQuery(query: any): Network {
  const network = query.network as string;
  if (!network || (network !== "mainnet" && network !== "testnet")) {
    return "mainnet"; // Default to mainnet
  }
  return network as Network;
}

export function getSupabaseTableName(
  tableName: string,
  network: Network
): string {
  if (network === "testnet") {
    return `testnet_${tableName}`;
  }
  return tableName;
}
