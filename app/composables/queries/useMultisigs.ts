import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { keys } from "~/utils/state.keys";

const { Multisig } = multisig.accounts;

export function useMultisig(
  multisigAddress: Ref<string>,
  onInvoke?: (qk?: string) => void
) {
  const { network } = useConnection();
  const ONCHAIN_MULTISIG_QUERY_KEY = computed(() =>
    keys.onchainMultisig(multisigAddress.value, network.value)
  );

  onInvoke?.(ONCHAIN_MULTISIG_QUERY_KEY.value);

  watch(
    () => ONCHAIN_MULTISIG_QUERY_KEY.value,
    async () => {
      await useAsyncData(ONCHAIN_MULTISIG_QUERY_KEY.value, async () => {
        const connection = connectionManager.getCurrentConnection();
        let multisigAccount;
        try {
          multisigAccount = await Multisig.fromAccountAddress(
            connection,
            new PublicKey(multisigAddress.value)
          );
        } catch (error) {
          console.error(
            "Failed to fetch multisig account:",
            error,
            `on ${network.value}`
          );
          throw new Error(
            `Unable to find Multisig account at ${multisigAddress.value} on ${network.value}`
          );
        }

        return multisigAccount.pretty();
      });
    }
  );

  const onchainMultisig = computed(
    () =>
      useNuxtData<multisig.generated.Multisig>(ONCHAIN_MULTISIG_QUERY_KEY.value)
        .data.value
  );

  return onchainMultisig;
}
