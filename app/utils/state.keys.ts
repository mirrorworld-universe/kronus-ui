export const keys = {
  multisigsByMember: (address: string) => `multisigs:member:${address}`,
  multisig: (genesisVault: string) => `multisigs:${genesisVault}`,
  onchainMultisig: (multisigAddress: string) => `onchain:multisig:${multisigAddress}`,
  vaults: (multisigAddress: string) => `vaults:${multisigAddress}`,
  tokenBalances: (address: string) => `account:token-balance:${address}`
};
