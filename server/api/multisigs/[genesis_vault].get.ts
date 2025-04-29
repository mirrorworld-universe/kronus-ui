import type { Database } from "../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";

export default eventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const genesis_vault = getRouterParam(event, "genesis_vault");

  const firstVaultPublicKey = solanaPublicKey.safeParse(genesis_vault);
  if (firstVaultPublicKey.error) throw createError({
    statusCode: 400,
    statusMessage: firstVaultPublicKey.error.errors.flat().join(),
  });

  const { data } = await client.from("multisigs").select().eq("first_vault", firstVaultPublicKey.data).single();
  return data;
});
