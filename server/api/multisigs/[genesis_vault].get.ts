import type { Database } from "../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";
import {
  getNetworkFromQuery,
  getSupabaseTableName,
} from "../../db/network-tables";

export default eventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const genesis_vault = getRouterParam(event, "genesis_vault");
  const query = getQuery(event);
  const network = getNetworkFromQuery(query);
  const tableName = getSupabaseTableName("multisigs", network);

  const firstVaultPublicKey = solanaPublicKey.safeParse(genesis_vault);
  if (firstVaultPublicKey.error)
    throw createError({
      statusCode: 400,
      statusMessage: firstVaultPublicKey.error.errors.flat().join(),
    });

  const { data } = await (client as any)
    .from(tableName)
    .select()
    .eq("first_vault", firstVaultPublicKey.data)
    .single();
  return data;
});
