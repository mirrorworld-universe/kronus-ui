import type { Database } from "../../../schema.gen";
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

  const { data: _multisig_members } = await client.from("multisig_members").select().eq("public_key", creatorPublicKey.data);
  const { data } = await client.from("multisigs").select().in("public_key", (_multisig_members || [])?.map(member => member.multisig_id));

  return data;
});
