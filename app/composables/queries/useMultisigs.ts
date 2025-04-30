import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const { Multisig } = multisig.accounts;

export function useMultisig(multisigAddress: Ref<string>) {
  return useAsyncData(`onchain:multisig:${multisigAddress.value}`, async () => {
    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigAddress.value)
    );

    return multisigAccount;
  });
}
