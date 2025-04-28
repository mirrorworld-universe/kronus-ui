import type { Database } from "../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";

export default eventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const creator = getRouterParam(event, "creator");

  const creatorPublicKey = solanaPublicKey.safeParse(creator);
  if (creatorPublicKey.error) throw createError({
    statusCode: 400,
    statusMessage: creatorPublicKey.error.errors.flat().join(),
  });

  const { data } = await client.from("multisigs").select().eq("creator", creatorPublicKey.data);

  return data;
});
