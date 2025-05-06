import { useMultisig } from "./useMultisigs";

export async function useGenesisVault() {
  const router = useRouter();
  const route = useRoute();
  const { walletAddress } = useWalletConnection();
  const { data: multsigsByMember } = await useAsyncData(keys.multisigsByMember(walletAddress.value!), () => $fetch(`/api/multisigs/creator/${walletAddress.value}`));

  if (multsigsByMember.value?.length && multsigsByMember.value?.length < 1) {
    console.debug("no vaults from this wallet address");
    await router.push(`/create`);
  }

  const firstMultisig = computed(() => multsigsByMember.value![0]!);
  const genesisVault = computed(() => route.params?.genesis_vault as unknown as string || firstMultisig.value!.first_vault);

  const firstMultisigAddress = computed(() => firstMultisig.value?.public_key);
  await useMultisig(firstMultisigAddress);

  return {
    genesisVault
  };
}
