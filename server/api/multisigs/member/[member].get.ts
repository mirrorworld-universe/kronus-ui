import type { Database } from "../../../schema.gen";
import { serverSupabaseClient } from "#supabase/server";
import { solanaPublicKey } from "~~/server/validations/schemas";
import {
  getNetworkFromQuery,
  getSupabaseTableName,
} from "../../../db/network-tables";

export default eventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const member = getRouterParam(event, "member");
  const query = getQuery(event);
  const network = getNetworkFromQuery(query);
  const multisigMembersTableName = getSupabaseTableName(
    "multisig_members",
    network
  );
  const multisigsTableName = getSupabaseTableName("multisigs", network);

  const memberPublicKey = solanaPublicKey.safeParse(member);
  if (memberPublicKey.error)
    throw createError({
      statusCode: 400,
      statusMessage: memberPublicKey.error.errors.flat().join(),
    });

  const { data: _multisig_members } = await (client as any)
    .from(multisigMembersTableName)
    .select()
    .eq("public_key", memberPublicKey.data);
  const { data } = await (client as any)
    .from(multisigsTableName)
    .select()
    .in(
      "public_key",
      (_multisig_members || [])?.map((member: any) => member.multisig_id)
    );

  return data;
});
