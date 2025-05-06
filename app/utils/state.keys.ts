export const keys = {
  multisigsByMember: (address: string) => `multisigs:member:${address}`,
  multisig: (genesisVault: string) => `multisigs:${genesisVault}`,
  onchainMultisig: (multisigAddress: string) => `onchain:multisig:${multisigAddress}`,
  vaults: (multisigAddress: string) => `vaults:${multisigAddress}`,
  tokenBalances: (address: string) => `account:token-balance:${address}`,
  transactions: ({ startIndex, endIndex, multisigAddress, programId, page }: {
    startIndex: number; endIndex: number; multisigAddress: string; programId: string; page: number;
  }) => `transactions:page:${page}:${startIndex}:${endIndex}:${multisigAddress}:${programId}`
};
