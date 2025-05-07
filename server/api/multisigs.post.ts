import { z } from "zod";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js/lib/index.esm";
import { db } from "../db";
import { multisigs, multisigMembers, vaults } from "../db/schema";
import { createMultisigSchema } from "../validations/schemas";

import { SQUADS_V4_PROGRAM_ID } from "../../app/utils/constants";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // Validate request body
    const validatedData = createMultisigSchema.parse(body);

    // Derive frist vault multisig address
    const [firstVaultPublicKey] = multisig.getVaultPda({
      index: 0,
      multisigPda: new PublicKey(validatedData.address),
      programId: SQUADS_V4_PROGRAM_ID,
    });

    // Create the multisig
    const result = await db.insert(multisigs).values({
      id: validatedData.address,
      publicKey: validatedData.address,
      createKey: validatedData.create_key,
      firstVault: firstVaultPublicKey.toBase58(),
      name: validatedData.name,
      description: validatedData.description,
      creator: validatedData.creator_address,
      threshold: validatedData.threshold,
    }).returning();

    // Add members
    await Promise.all(
      validatedData.members.map(member =>
        db.insert(multisigMembers).values({
          multisigId: validatedData.address,
          publicKey: member.address,
        })
      )
    );

    // Create initial vault
    await db.insert(vaults).values({
      multisigId: validatedData.address,
      name: "Default",
      publicKey: firstVaultPublicKey.toBase58(),
      vaultIndex: 0,
    });

    setResponseStatus(event, 201);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: "Validation failed",
        data: error.errors
      });
    }

    console.error("Error storing multisig:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to store multisig data"
    });
  }
});
