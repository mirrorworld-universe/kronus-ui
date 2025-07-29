import { z } from "zod";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import type { Database } from "../../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";
import { connectionManager } from "~/utils/connection.manager";
import {
  getNetworkFromQuery,
  getSupabaseTableName,
} from "../../../db/network-tables";

const { Multisig } = multisig.accounts;

export default eventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event);
    const multisig = getRouterParam(event, "multisig");
    const query = getQuery(event);
    const network = getNetworkFromQuery(query);
    const tableName = getSupabaseTableName("transactions", network);

    const multisigPublicKey = solanaPublicKey.safeParse(multisig);
    // Validate that the multisig account exists

    if (multisigPublicKey.error)
      throw createError({
        statusCode: 400,
        statusMessage: multisigPublicKey.error.errors.flat().join(),
      });

    const connection = connectionManager.getCurrentConnection();
    const multisigAccount = await Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigPublicKey.data)
    );

    if (!multisigAccount)
      throw createError({
        statusCode: 500,
        statusMessage: `Could not find multisig with address ${multisigPublicKey.data}`,
      });

    const { data, error } = await (client as any)
      .from(tableName)
      .select()
      .eq("multisig_id", multisigPublicKey.data);

    if (error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });

    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.errors.map((e) => e.message).join(", "),
      });
    }
    throw error;
  }
});
