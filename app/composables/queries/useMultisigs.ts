import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const { Multisig } = multisig.accounts;

export function useMultisig(multisigAddress: Ref<string>) {
  return useAsyncData(keys.onchainMultisig(multisigAddress.value), async () => {
    const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(multisigAddress.value));
    const { data: multisig } = useNuxtData<multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value);

    if (multisig.value) return multisig.value;

    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigAddress.value)
    );

    return multisigAccount.pretty();
  });
}
