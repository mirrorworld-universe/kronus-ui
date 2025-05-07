import { useMultisig } from "./useMultisigs";

export async function useGenesisVault() {
  const router = useRouter();
  const route = useRoute();
  const { walletAddress, connected } = useWalletConnection();

  const MULTISIG_BY_MEMBER_QUERY_KEY = computed(() => keys.multisigsByMember(walletAddress.value!));
  const { data: multsigsByMember } = await useAsyncData(MULTISIG_BY_MEMBER_QUERY_KEY.value, () => {
    if (!walletAddress.value || !connected.value) return Promise.resolve([]);
    return $fetch(`/api/multisigs/member/${walletAddress.value}`);
  });

  if (multsigsByMember.value?.length && multsigsByMember.value?.length < 1) {
    console.debug("no vaults from this wallet address");
    await router.push(`/create`);
  }

  const firstMultisig = computed(() => multsigsByMember.value?.[0]);
  const genesisVault = computed(() => route.params?.genesis_vault as unknown as string || firstMultisig.value?.first_vault || "");

  const currentMultisigAddress = computed(() => multsigsByMember.value!.find(ms => ms.first_vault === genesisVault.value)?.public_key || "");

  watchEffect(() => console.log("currentMultisigAddress", currentMultisigAddress.value));

  await useMultisig(currentMultisigAddress);

  const CURRENT_MULTISIG_QUERY_KEY = computed(() => keys.vaults(currentMultisigAddress.value));

  const { data: treasuryAccounts } = await useAsyncData(CURRENT_MULTISIG_QUERY_KEY.value, async () => {
    if (!currentMultisigAddress.value) return null;
    else {
      return $fetch(`/api/vaults/${currentMultisigAddress.value}`);
    }
  });

  return {
    genesisVault,
    treasuryAccounts
  };
}
