import { z } from "zod";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import type { Database } from "../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey, createVaultSchema } from "~~/server/validations/schemas";

const { Multisig } = multisig.accounts;

export default eventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event);
    const multisig = getRouterParam(event, "multisig");

    const multisigPublicKey = solanaPublicKey.safeParse(multisig);
    // Validate that the multisig account exists

    if (multisigPublicKey.error) throw createError({
      statusCode: 400,
      statusMessage: multisigPublicKey.error.errors.flat().join(),
    });

    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigPublicKey.data)
    );

    if (!multisigAccount) throw createError({
      statusCode: 500,
      statusMessage: `Could not find multisig with address ${multisigPublicKey.data}`,
    });

    const body = await readBody(event);

    // Validate request body
    const validatedData = createVaultSchema.parse(body);
    // Insert the new vault into the database
    const { data: vault, error } = await client
      .from("vaults")
      .insert({
        multisig_id: validatedData.multisig_id,
        vault_index: validatedData.vault_index,
        public_key: validatedData.public_key,
        name: validatedData.name,
      })
      .select()
      .single();

    if (error) throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });

    return vault;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.errors.map(e => e.message).join(", "),
      });
    }
    throw error;
  }
});
