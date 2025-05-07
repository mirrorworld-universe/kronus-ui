import type { PublicKey } from "@solana/web3.js/lib/index.esm";
import { Keypair, Transaction } from "@solana/web3.js/lib/index.esm";
import * as multisig from "@sqds/multisig";
import { $fetch } from "ofetch";

export async function createMultisig(
  wallet: WalletStore,
  creator: PublicKey,
  configAuthority: PublicKey | null,
  timeLock: number,
  members: multisig.types.Member[],
  threshold: number,
  rentCollector: PublicKey | null,
  name: string,
  description: string,
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
    async ({ status }) => {
      if (status === "confirmed") {
        console.log(
          "Successfully Created Squad Multisig: ",
          multisigPda.toBase58()
        );
        console.info("Write this address down, you will need it later.");

        // Derive frist vault multisig address
        const [firstVaultPublicKey] = multisig.getVaultPda({
          index: 0,
          multisigPda,
          programId: SQUADS_V4_PROGRAM_ID,
        });

        // Store multisig data in D1
        try {
          const firstMultisig = await $fetch("/api/multisigs", {
            method: "POST",
            body: {
              address: multisigPda.toBase58(),
              creator_address: creator.toBase58(),
              create_key: createKey.toBase58(),
              first_vault: firstVaultPublicKey.toBase58(),
              name,
              description,
              created_at: Math.floor(Date.now() / 1000),
              members: members.map(m => ({
                address: m.key.toBase58(),
                permissions: m.permissions
              })),
              threshold,
              vault_index: 0
            }
          });

          return {
            signature,
            firstMultisig,
            multisigAddress: multisigPda.toBase58(),
          };
        } catch (error) {
          console.error("Failed to store multisig data:", error);
        }
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
      const [vaultAccount] = multisig.getVaultPda({
        index: index,
        multisigPda: multisigAddress,
        programId: SQUADS_V4_PROGRAM_ID,
      });
      return {
        vaultAccount,
        vaultIndex: index
      };
    });
    const vaults = await Promise.all(vaultIndexPromises);
    return vaults;
  } catch (error) {
    console.error("Error fetching multisig vaults:", error);
    throw error;
  }
}

export type MemberRole = "Proposer" | "Voter" | "Executor";
export function memberToRoles(member: multisig.generated.Member): MemberRole[] {
  const roles: MemberRole[] = [];
  const mask = member.permissions.mask;

  if (mask & 1) roles.push("Proposer");
  if (mask & 2) roles.push("Voter");
  if (mask & 4) roles.push("Executor");
  // if (mask === 7) roles.push("Almighty");

  return roles;
}
