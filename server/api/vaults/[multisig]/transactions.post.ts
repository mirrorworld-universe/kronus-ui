import { z } from "zod";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js/lib/index.esm";
import type { Database } from "../../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey, createTransactionSchema, TransactionType } from "~~/server/validations/schemas";
import { connectionManager } from "~/utils/connection.manager";

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
    const validatedData = createTransactionSchema.parse({
      multisig_id: multisigPublicKey.data,
      vault_index: body.vault_index,
      transaction_pda: body.transaction_pda,
      vault_account: body.vault_account,
      metadata: body.metadata || {
        type: TransactionType.Arbitrary
      }
    });
    // Insert the new transaction into the database
    const { data: vault, error } = await client
      .from("transactions")
      .insert({
        id: validatedData.transaction_pda,
        multisig_id: validatedData.multisig_id,
        transaction_pda: validatedData.transaction_pda,
        vault_index: validatedData.vault_index,
        vault_account: validatedData.vault_account,
        metadata: validatedData.metadata
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
