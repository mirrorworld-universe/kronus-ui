<script setup lang="ts">
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import type { IVault } from "~/types/squads";
import { TransactionType, TransferAssetType, TransferType } from "~~/server/validations/schemas";

const router = useRouter();
const route = useRoute();
const genesisVault = computed(() => route.params?.genesis_vault as unknown as string);
const toast = useToast();
const wallet = useWallet();
const { isMultisigMember, userCanPropose } = await useAuthorize();

const props = defineProps<{
  multisigAddress: string;
}>();

const isAuthorized = computed(() => isMultisigMember.value && userCanPropose.value);

const open = ref(false);

emitter.on("send:open", () => {
  if (!isAuthorized.value) return;
  open.value = true;
});
emitter.on("send:close", () => {
  open.value = false;
});

defineShortcuts({
  s: () => {
    if (!isAuthorized.value) return;
    open.value = !open.value;
  }
});

// const route = useRoute();

const VAULTS_QUERY_KEY = computed(() => keys.vaults(props.multisigAddress));

const { data } = useNuxtData<IVault[]>(VAULTS_QUERY_KEY.value);

const vaults = computed(() => (data.value || []).map(vault => ({
  label: vault.name,
  value: vault.public_key,
  vault_index: vault.vault_index,
  balance: 0,
})).sort((a, b) => a.vault_index - b.vault_index));

const sendingItems = computed(() => vaults.value.map((vault) => {
  const vaultTokens = useNuxtData<FormattedTokenBalanceWithPrice[]>(keys.tokenBalances(vault.value))?.data.value || [];
  const vaultTokensValue = vaultTokens.reduce((acc, curr) => acc + curr.tokenValue, 0);
  return {
    ...vault,
    tokens: vaultTokens,
    truncatedVaultAddress: truncateMiddle(vault.value),
    vaultTokensValue: Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencySign: "standard",
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(vaultTokensValue)
  };
}));

const sendingValue = ref(sendingItems.value[0]);

const sendingVaultTokensList = computed(() => (sendingValue.value?.tokens || []).map(token => ({
  ...token,
  label: token.symbol,
  value: token.mint
})));
const sendingVaultTokenValue = ref(sendingVaultTokensList.value[0]);

const amountHelperText = computed(() => sendingVaultTokenValue.value ? `Balance: ${sendingVaultTokenValue.value?.uiAmount} $${sendingVaultTokenValue.value?.symbol}` : undefined);

watchEffect(() => {
  (vaults.value || []).forEach((vault) => {
    useAsyncData(keys.tokenBalances(vault.value), () => $fetch(`/api/balances/${vault.value}`));
  });
});

const sendTokenData = reactive({
  receipientAddress: "",
  amount: 0,
  note: ""
});

const sendTokenPayload = computed(() => ({
  fromAddress: sendingValue.value!.value,
  receipientAddress: sendTokenData.receipientAddress,
  amount: sendTokenData.amount,
  note: sendTokenData.note,
  token: sendingVaultTokenValue
}));

const pending = ref(false);
async function proposeSendTokenTransaction() {
  const connection = connectionManager.getCurrentConnection();
  pending.value = true;
  try {
    if (!wallet.publicKey.value) throw new Error("Wallet not connected. Please connect your wallet and try again");
    if (!sendingValue.value) throw new Error("Sending vault not selected. Please try again.");
    if (!sendTokenPayload.value) throw new Error("Token not selected. Please try again.");
    if (!sendingVaultTokenValue.value || !sendTokenPayload.value?.token?.value) throw new Error("Sending vault not selected. Please try again.");

    // Build Transaction Data
    const tx = new Transaction();

    const proposerPublicKey = wallet.publicKey;
    const sendingVaultPublicKey = new PublicKey(sendingValue.value.value);
    const receipientPublicKey = new PublicKey(sendTokenPayload.value.receipientAddress);
    const selectedVaultIndex = sendingValue.value.vault_index;

    const isSOL = sendTokenPayload.value.token.value.symbol === "SOL";

    if (isSOL) {
      const lamportsToSend = sendTokenPayload.value.amount * LAMPORTS_PER_SOL;
      console.log("lamportsToSend", {
        amount: sendTokenPayload.value.amount,
        lamportsToSend
      });
      const transferSOLInstruction = SystemProgram.transfer({
        fromPubkey: sendingVaultPublicKey,
        toPubkey: receipientPublicKey,
        lamports: lamportsToSend
      });

      tx.add(transferSOLInstruction);
    } else {
      const tokenDecimals = sendTokenPayload.value.token.value.decimals;
      const tokenMint = new PublicKey(sendTokenPayload.value.token.value.mint);
      const amountToSend = sendTokenPayload.value.amount * 10 ** tokenDecimals;
      const tokenProgram = sendTokenPayload.value.token.value.tokenProgram === "Token-2022 Program" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      // Get the associated token account address for the source (vault)
      const sourceTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        new PublicKey(sendingVaultPublicKey),
        // Need to allow the owner off-curve since
        // we are transferring from a Vault PDA
        true,
        tokenProgram
      );

      // Get the associated token account address for the recipient
      const destinationTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        receipientPublicKey,
        // Need to allow the owner off-curve since
        // we may be transferring to a Vault PDA
        true,
        tokenProgram
      );

      // Check if the receiving ATA exists. if not include a create ATA instruction before the transfer
      // instruction.
      const destinationAccountInfo = await connection.getAccountInfo(
        destinationTokenAccount
      );

      if (!destinationAccountInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          new PublicKey(sendingVaultPublicKey), // payer
          destinationTokenAccount, // ata
          receipientPublicKey, // owner
          tokenMint, // mint
          tokenProgram
        );
        tx.add(createATAInstruction);
      }

      const SPLTokenTransferInstruction = createTransferInstruction(
        sourceTokenAccount, // Source token account
        destinationTokenAccount, // Destination token account
        new PublicKey(sendingVaultPublicKey), // Owner of source token account
        amountToSend,
        [], // Additional signers
        tokenProgram
      );

      tx.add(SPLTokenTransferInstruction);
    }

    const isInternalTransfer = vaults.value.find(vault => vault.value === sendTokenPayload.value.receipientAddress);

    const metadata: CreateTransactionMetadata = {
      type: TransactionType.Send,
      assetType: isSOL ? TransferAssetType.SOL : TransferAssetType.SPL,
      transferType: isInternalTransfer ? TransferType.VaultToVault : TransferType.VaultToExternal,
      description: sendTokenPayload.value.note
    };

    const result = await createSquadsVaultTransaction(
      tx,
      props.multisigAddress,
      selectedVaultIndex,
      proposerPublicKey.value!,
      wallet,
      toast,
      metadata
    );

    if (result) {
      emitter.emit("transactions:refresh");
      console.log("successfully proposed transaction");
      await router.push(`/squads/${genesisVault.value}/transactions`);
      open.value = false;
    }
  } catch (error: any) {
    console.error(error);
    toast.add({
      title: `Could not initiate send token`,
      description: error.message
    });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Send"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="flex flex-col gap-3 w-full">
        <!-- Send Type -->
        <!-- Sonic SVM address -->

        <UModal title="Send to a Sonic SVM address" :ui="{ footer: 'justify-end' }">
          <UCard variant="soft">
            <div class="flex items-start justify-start gap-3 text-ui-highlighted">
              <UIcon name="material-symbols:arrow-outward-rounded" class="size-6" />
              <div class="flex flex-col gap-1 justify-start items-start">
                <div>Send to a wallet</div>
                <div class="text-(--ui-text-muted) text-xs">
                  Send to a Sonic SVM address
                </div>
              </div>
            </div>
          </UCard>

          <template #body>
            <div class="flex flex-col justify-start items-start gap-6 w-full">
              <UFormField
                label="From"
                class="w-full"
                size="lg"
                required
              >
                <USelectMenu v-model="sendingValue" :items="sendingItems" class="w-full">
                  <template #item-label="{ item }">
                    <div class="flex flex-col gap-1 w-full">
                      <div class="text-ui(--ui-text-highlighted)">
                        {{ item.label }} • {{ item.vaultTokensValue }}
                      </div>
                      <div class="text-(--ui-text-muted) text-xs">
                        {{ item.truncatedVaultAddress }}
                      </div>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>
              <UFormField
                label="Recipient"
                class="w-full"
                size="lg"
                required
              >
                <UInput v-model="sendTokenData.receipientAddress" class="w-full" placeholder="Enter the recipient address" />
                <template #help>
                  <UAlert
                    class="bg-transparent w-full px-0 opacity-80 py-0"
                    :ui="{
                      description: 'text-xs text-warning',
                      icon: 'size-4 text-warning'
                    }"
                    color="warning"
                    variant="ghost"
                    description="Some CEXs do not recognize transfers from Squads multisigs, if sending assets to a CEX make sure to send a test transaction first."
                    icon="i-lucide-info"
                  />
                </template>
              </UFormField>
              <hr>
              <UFormField
                label="Amount"
                class="w-full"
                size="lg"
                :help="amountHelperText"
                required
              >
                <UButtonGroup class="w-full" size="xl">
                  <UInput
                    v-model="sendTokenData.amount"
                    placeholder="Enter Amount"
                    class="w-full"
                    size="xl"
                    type="number"
                  />
                  <USelectMenu v-model="sendingVaultTokenValue" :items="sendingVaultTokensList" class="flex-shrink-0 w-32">
                    <template #default="{ modelValue }">
                      <div v-if="modelValue" class="flex items-center gap-2 leading-0">
                        <UAvatar size="xs" :alt="modelValue.symbol" :src="modelValue.symbol === 'SOL' ? '/sol.png' : modelValue.metadata?.image!" />
                        <span class="leading-0">{{ modelValue.symbol }}</span>
                      </div>
                    </template>
                    <template #item-leading="{ item }">
                      <UAvatar size="sm" :alt="item.symbol" :src="item.symbol === 'SOL' ? '/sol.png' : item.metadata?.image!" />
                    </template>
                    <template #item-label="{ item }">
                      <span>{{ item.symbol }}</span>
                    </template>
                  </USelectMenu>
                </UButtonGroup>
              </UFormField>

              <UFormField
                label="Note"
                class="w-full"
              >
                <UTextarea
                  v-model="sendTokenData.note"
                  color="neutral"
                  variant="subtle"
                  class="w-full"
                  placeholder="Add a note ..."
                />
              </UFormField>
            </div>
          </template>
          <template #footer>
            <UButton
              label="Initiate"
              color="neutral"
              variant="solid"
              size="xl"
              @click="proposeSendTokenTransaction"
            />
          </template>
        </UModal>

        <!-- Transfer between vaults -->
        <!-- <UCard variant="soft">
          <div class="flex items-start justify-start gap-3 text-ui-highlighted">
            <UIcon name="material-symbols:arrow-range-rounded" class="size-6" />
            <div class="flex flex-col gap-1 justify-start items-start">
              <div>Transfer between vault accounts</div>
              <div class="text-(--ui-text-muted) text-xs">
                Move funds between accounts inside your Multisig / Squad
              </div>
            </div>
          </div>
        </UCard> -->
      </div>
    </template>
  </UModal>
</template>
