import { Transaction, type Keypair, type PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

export async function createMultisig(
  feePayer: PublicKey,
  createKey: PublicKey,
  creator: PublicKey,
  configAuthority: PublicKey | null,
  timeLock: number,
  members: multisig.types.Member[],
  threshold: number,
  treasury: PublicKey,
  rentCollector: PublicKey | null,
  memo: string,
  signers: Keypair[]
) {
  console.info("started createMultisig");

  const [multisigPda] = multisig.getMultisigPda({
    createKey: createKey,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const multisigCreateV2Ix = multisig.instructions.multisigCreateV2({
    createKey: createKey,
    creator: creator,
    multisigPda: multisigPda,
    configAuthority: configAuthority,
    timeLock: timeLock,
    members: members,
    threshold: threshold,
    treasury: treasury,
    rentCollector: rentCollector,
    memo: memo,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const tx: Transaction = new Transaction();

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = feePayer;

  tx.add(multisigCreateV2Ix);

  const signature = await signAndSendTransaction(
    connection,
    signers,
    tx,
    ({ status }) => {
      if (status === "confirmed") {
        console.success(
          "Successfully Created Squad Multisig: ",
          multisigPda.toBase58()
        );
        console.info("Write this address down, you will need it later.");
      }
    }
  );
  return {
    signature,
    multisigAddress: multisigPda.toBase58(),
  };
}
