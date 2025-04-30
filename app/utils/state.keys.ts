export const keys = {
  multisigsByMember: (address: string) => `multisigs:member:${address}`,
  multisig: (genesisVault: string) => `multisigs:${genesisVault}`,
  vaults: (multisigAddress: string) => `vaults:${multisigAddress}`,
  tokenBalances: (address: string) => `account:token-balance:${address}`
};
