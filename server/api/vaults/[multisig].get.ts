import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import type { Database } from "../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";
import { connectionManager } from "~/utils/connection.manager";

const { Multisig } = multisig.accounts;

export default eventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event);
    const multisig = getRouterParam(event, "multisig");

    const multisigPublicKey = solanaPublicKey.safeParse(multisig);

    if (multisigPublicKey.error) throw createError({
      statusCode: 400,
      statusMessage: multisigPublicKey.error.errors.flat().join(),
    });

    // Validate that the multisig account exists
    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigPublicKey.data)
    );

    if (!multisigAccount) throw createError({
      statusCode: 404,
      statusMessage: `Could not find multisig with address ${multisigPublicKey.data}`,
    });

    const { data, error } = await client.from("vaults").select().eq("multisig_id", multisigPublicKey.data);

    if (error) throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }
    throw error;
  }
});
