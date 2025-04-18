import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

export async function createMultisig(
  wallet: WalletStore,
  creator: PublicKey,
  configAuthority: PublicKey | null,
  timeLock: number,
  members: multisig.types.Member[],
  threshold: number,
  rentCollector: PublicKey | null,
  memo: string,
) {
  console.info("started createMultisig");

  if (!wallet.publicKey.value || !wallet.connected) throw new Error("Wallet not connected.");

  const createKeyPair = Keypair.generate();
  const createKey = createKeyPair.publicKey;
  const feePayer = wallet.publicKey.value;

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
    treasury: PROGRAM_TREASURY_ACCOUNT,
    rentCollector: rentCollector,
    memo: memo,
    programId: SQUADS_V4_PROGRAM_ID,
  });

  const tx: Transaction = new Transaction();

  const connection = connectionManager.getCurrentConnection();

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = feePayer;

  tx.add(multisigCreateV2Ix);
  const signers = [createKeyPair];

  const signature = await signAndSendTransaction(
    connection,
    wallet,
    signers,
    tx,
    ({ status }) => {
      if (status === "confirmed") {
        console.log(
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

export interface VaultInfo {
  address: PublicKey;
  authority: PublicKey;
  createTime: number;
  creator: PublicKey;
  name: string;
}

export async function listMultisigVaults(
  multisigAddress: PublicKey
) {
  try {
    const vaultIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const vaultIndexPromises = vaultIndices.map((index) => {
      const [vaultPublicKey] = multisig.getVaultPda({
        index: index,
        multisigPda: multisigAddress,
        programId: SQUADS_V4_PROGRAM_ID,
      });
      return vaultPublicKey;
    });
    const vaults = await Promise.all(vaultIndexPromises);
    return vaults;
  } catch (error) {
    console.error("Error fetching multisig vaults:", error);
    throw error;
  }
}
