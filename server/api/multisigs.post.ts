import { z } from "zod";
import { db } from "../db";
import { multisigs, multisigMembers, vaults } from "../db/schema";
import { createMultisigSchema } from "../validations/schemas";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // Validate request body
    const validatedData = createMultisigSchema.parse(body);

    // Create the multisig
    await db.insert(multisigs).values({
      id: validatedData.address,
      publicKey: validatedData.address,
      name: validatedData.name,
      threshold: validatedData.threshold,
    });

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
      vaultIndex: 0,
    });

    return { success: true };
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
