export const keys = {
  multisigsByMember: (address: string) => `multisigs:member:${address}`,
  multisig: (genesisVault: string) => `multisigs:${genesisVault}`,
  onchainMultisig: (multisigAddress: string) => `onchain:multisig:${multisigAddress}`,
  vaults: (multisigAddress: string) => `vaults:${multisigAddress}`,
  tokenBalances: (address: string) => `account:token-balance:${address}`,
  transactions: ({ startIndex, endIndex, multisigAddress, programId }: {
    startIndex: number; endIndex: number; multisigAddress: string; programId: string;
  }) => `transactions:${startIndex}:${endIndex}:${multisigAddress}:${programId}`
};
