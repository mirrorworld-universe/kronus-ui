import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const { Multisig } = multisig.accounts;

export function useMultisig(multisigAddress: Ref<string>) {
  const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(multisigAddress.value));
  return useAsyncData(ONCHAIN_MULTISIG_QUERY_KEY.value, async () => {
    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigAddress.value)
    );

    return multisigAccount.pretty();
  });
}
