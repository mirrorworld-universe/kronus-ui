<script setup lang="ts">
import type { Toast } from "@nuxt/ui/runtime/composables/useToast.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { useWallet } from "solana-wallets-vue";
import { useRefresh } from "~/composables/queries/useRefresh";
import { useAuthorize } from "~/composables/useWalletConnection";

type RejectButtonProps = {
  multisigPda: string;
  transactionIndex: number;
  proposal: multisig.generated.Proposal;
  proposalStatus: string;
  transactionsPageQuery: string;
};
const props = defineProps<RejectButtonProps>();

const wallet = useWallet();
const { walletAddress, connected, openModal, publicKey } = useWalletConnection();
const connection = connectionManager.getCurrentConnection();

const { isMultisigMember, userCanVote } = await useAuthorize();
const canVote = computed(() => isMultisigMember.value && userCanVote.value && !userAlreadyRejected.value && !transactionAlreadyExecuted.value);

const toast = useToast();

const TRANSACTIONS_QUERY_KEY = computed(() => props.transactionsPageQuery);
const { refresh } = useRefresh(TRANSACTIONS_QUERY_KEY);

const isProposalInValidState = computed(() => ["None", "Active", "Draft"].includes(props.proposalStatus));

const userAlreadyRejected = computed(() => props.proposal.rejected.find(member => member.toBase58() === walletAddress.value));
const transactionAlreadyExecuted = computed(() => props.proposalStatus.toLowerCase() === "executed");

const pending = ref(false);

let t: Toast;
const rejectTransaction = async () => {
  try {
    pending.value = true;
    if (!connected.value || !walletAddress.value || !publicKey.value) {
      openModal();
      throw "Wallet not connected";
    }

    const bigIntTransactionIndex = BigInt(props.transactionIndex);
    const transaction = new Transaction();
    if (props.proposalStatus === "None") {
      const createProposalInstruction = multisig.instructions.proposalCreate({
        multisigPda: new PublicKey(props.multisigPda),
        creator: new PublicKey(walletAddress.value!),
        isDraft: false,
        transactionIndex: bigIntTransactionIndex,
        rentPayer: publicKey.value,
        programId: SQUADS_V4_PROGRAM_ID,
      });
      transaction.add(createProposalInstruction);
    }
    if (props.proposalStatus == "Draft") {
      const activateProposalInstruction = multisig.instructions.proposalActivate({
        multisigPda: new PublicKey(props.multisigPda),
        member: publicKey.value,
        transactionIndex: bigIntTransactionIndex,
        programId: SQUADS_V4_PROGRAM_ID,
      });
      transaction.add(activateProposalInstruction);
    }
    const rejectProposalInstruction = multisig.instructions.proposalReject({
      multisigPda: new PublicKey(props.multisigPda),
      member: publicKey.value,
      transactionIndex: bigIntTransactionIndex,
      programId: SQUADS_V4_PROGRAM_ID,
    });
    transaction.add(rejectProposalInstruction);

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey.value;

    const signature = await signAndSendTransaction(connection, wallet, [], transaction, ({ status }) => {
      console.log("status", status);
      if (status === "created") {
        if (!t) {
          t = toast.add({
            description: "Pending signature",
            icon: "svg-spinners:bars-rotate-fade",
            color: "neutral", duration: Infinity
          });
        }
      } else if (status === "signed") {
        toast.update(t.id, {
          description: "Signed. Sending transaction ..."
        });
      } else if (status === "sent") {
        toast.update(t.id, {
          description: "Confirming..."
        });
      } else if (status === "confirmed") {
        toast.update(t.id, {
          description: "Confirmed!",
          color: "success",
          duration: 3000
        });
      }
    });
    console.log("successfully approved", signature);
    await refresh();
  } catch (error: any) {
    console.error(error);
  } finally {
    pending.value = false;
    setTimeout(() => {
      toast.remove(t.id);
    }, 3000);
  }
};
</script>

<template>
  <UButton :disabled="!canVote || !isProposalInValidState" @click="rejectTransaction">
    {{ userAlreadyRejected ? 'Rejected' : 'Reject' }}
  </UButton>
</template>
