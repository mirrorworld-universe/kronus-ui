export const keys = {
  multisigsByMember: (address: string, network: Network) => `multisigs:member:${address}:${network}`,
  multisig: (genesisVault: string, network: Network) => `multisigs:${genesisVault}:${network}`,
  onchainMultisig: (multisigAddress: string, network: Network) => `onchain:multisig:${multisigAddress}:${network}`,
  vaults: (multisigAddress: string, network: Network) => `vaults:${multisigAddress}:${network}`,
  tokenBalances: (address: string, network: Network) => `account:token-balance:${address}:${network}`,
  transactions: ({ startIndex, endIndex, multisigAddress, programId, page, network }: {
    startIndex: number; endIndex: number; multisigAddress: string; programId: string; page: number; network: Network;
  }) => `transactions:page:${page}:${startIndex}:${endIndex}:${multisigAddress}:${programId}:${network}`
};
