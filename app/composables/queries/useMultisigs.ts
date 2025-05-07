import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const { Multisig } = multisig.accounts;

export function useMultisig(multisigAddress: Ref<string>, onInvoke?: (qk?: string) => void) {
  const ONCHAIN_MULTISIG_QUERY_KEY = computed(() => keys.onchainMultisig(multisigAddress.value));

  onInvoke?.(ONCHAIN_MULTISIG_QUERY_KEY.value);

  watch(() => ONCHAIN_MULTISIG_QUERY_KEY.value, async () => {
    await useAsyncData(ONCHAIN_MULTISIG_QUERY_KEY.value, async () => {
      const connection = connectionManager.getCurrentConnection();
      const multisigAccount = await Multisig.fromAccountAddress(
        connection,
        new PublicKey(multisigAddress.value)
      );

      return multisigAccount.pretty();
    });
  });

  const onchainMultisig = computed(() => useNuxtData<multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value).data.value);

  return onchainMultisig;
}
