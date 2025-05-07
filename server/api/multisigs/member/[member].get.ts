import type { Database } from "../../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";

export default eventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const member = getRouterParam(event, "member");

  const memberPublicKey = solanaPublicKey.safeParse(member);
  if (memberPublicKey.error) throw createError({
    statusCode: 400,
    statusMessage: memberPublicKey.error.errors.flat().join(),
  });

  const { data: _multisig_members } = await client.from("multisig_members").select().eq("public_key", memberPublicKey.data);
  const { data } = await client.from("multisigs").select().in("public_key", (_multisig_members || [])?.map(member => member.multisig_id));

  return data;
});
