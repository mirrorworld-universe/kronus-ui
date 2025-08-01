import { useMultisig } from "./useMultisigs";
import type { IMultisig, IMultisigMember, IVault } from "~/types/squads";
import { keys } from "~/utils/state.keys";

export async function useGenesisVault() {
  const router = useRouter();
  const route = useRoute();
  const { walletAddress, connected } = useWalletConnection();
  const { network } = useConnection();
  const MULTISIG_BY_MEMBER_QUERY_KEY = computed(() =>
    keys.multisigsByMember(walletAddress.value!, network.value)
  );
  const { data: multsigsByMember } = await useAsyncData<IMultisig[]>(
    MULTISIG_BY_MEMBER_QUERY_KEY.value,
    () => {
      if (!walletAddress.value || !connected.value) return Promise.resolve([]);

      const cachedValue = useNuxtData<IMultisig[]>(
        MULTISIG_BY_MEMBER_QUERY_KEY.value
      ).data.value;
      if (cachedValue) {
        return Promise.resolve(cachedValue);
      } else {
        return $fetch(
          `/api/multisigs/member/${walletAddress.value}?network=${network.value}`
        );
      }
    }
  );

  if (multsigsByMember.value?.length && multsigsByMember.value?.length < 1) {
    console.debug("no vaults from this wallet address");
    await router.push(`/create?network=${network.value}`);
  }

  const firstMultisig = computed(() => multsigsByMember.value?.[0]);
  const genesisVault = computed(
    () =>
      (route.params?.genesis_vault as unknown as string) ||
      firstMultisig.value?.firstVault ||
      ""
  );

  const currentMultisigAddress = computed(
    () =>
      multsigsByMember.value!.find(
        (ms: IMultisig) => ms.firstVault === genesisVault.value
      )?.publicKey || ""
  );

  watchEffect(() =>
    console.log("currentMultisigAddress", currentMultisigAddress.value)
  );

  await useMultisig(currentMultisigAddress);

  const CURRENT_MULTISIG_QUERY_KEY = computed(() =>
    keys.vaults(currentMultisigAddress.value, network.value)
  );

  const { data: treasuryAccounts } = await useAsyncData(
    CURRENT_MULTISIG_QUERY_KEY.value,
    async () => {
      if (!currentMultisigAddress.value) return null;

      const cachedValue = useNuxtData<IVault[]>(
        CURRENT_MULTISIG_QUERY_KEY.value
      ).data.value;
      if (cachedValue) {
        return Promise.resolve(cachedValue);
      } else {
        return $fetch(
          `/api/vaults/${currentMultisigAddress.value}?network=${network.value}`
        );
      }
    }
  );

  return {
    genesisVault,
    treasuryAccounts,
  };
}
