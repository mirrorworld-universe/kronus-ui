<script setup lang="ts">
import type { Toast } from "@nuxt/ui/runtime/composables/useToast.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { useWallet } from "solana-wallets-vue";
import { useRefresh } from "~/composables/queries/useRefresh";
import { useAuthorize } from "~/composables/useWalletConnection";

type ApproveButtonProps = {
  multisigPda: string;
  transactionIndex: number;
  proposal: multisig.generated.Proposal;
  proposalStatus: string;
  transactionsPageQuery: string;
};
const props = defineProps<ApproveButtonProps>();

const wallet = useWallet();
const { walletAddress, connected, openModal, publicKey } = useWalletConnection();
const connection = connectionManager.getCurrentConnection();

const { isMultisigMember, userCanVote } = await useAuthorize();

const validKinds = ["Rejected", "Approved", "Executing", "Executed", "Cancelled"];
const isProposalInValidState = computed(() => validKinds.includes(props.proposalStatus));

const canVote = computed(() => isMultisigMember.value && userCanVote.value && !userAlreadyApproved.value && !transactionAlreadyExecuted.value);

const toast = useToast();

const TRANSACTIONS_QUERY_KEY = computed(() => props.transactionsPageQuery);
const { refresh } = useRefresh(TRANSACTIONS_QUERY_KEY);

const userAlreadyApproved = computed(() => props.proposal.approved.find(member => member.toBase58() === walletAddress.value));
const transactionAlreadyExecuted = computed(() => props.proposalStatus.toLowerCase() === "executed");

const pending = ref(false);

const approveProposal = async () => {
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
    const approveProposalInstruction = multisig.instructions.proposalApprove({
      multisigPda: new PublicKey(props.multisigPda),
      member: publicKey.value,
      transactionIndex: bigIntTransactionIndex,
      programId: SQUADS_V4_PROGRAM_ID,
    });
    transaction.add(approveProposalInstruction);

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey.value;

    let t: Toast;
    const signature = await signAndSendTransaction(connection, wallet, [], transaction, ({ status }) => {
      if (status === "created") {
        if (!t) {
          t = toast.add({
            description: "Pending signature",
            color: "neutral"
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
          description: "Confirmed",
          color: "success"
        });
      }
    });
    console.log("successfully approved", signature);
    await refresh();
  } catch (error: any) {
    console.error(error);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <UButton :disabled="!canVote || isProposalInValidState" @click="approveProposal">
    {{ userAlreadyApproved ? 'Approved' : 'Approve' }}
  </UButton>
</template>
