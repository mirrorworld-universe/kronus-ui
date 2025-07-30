import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { solanaPublicKey } from "~~/server/validations/schemas";
import {
  getNetworkFromQuery,
  getTablesByNetwork,
} from "../../../db/network-tables";

export default eventHandler(async (event) => {
  const member = getRouterParam(event, "member");
  const query = getQuery(event);
  const network = getNetworkFromQuery(query);
  const tables = getTablesByNetwork(network);

  const memberPublicKey = solanaPublicKey.safeParse(member);
  if (memberPublicKey.error)
    throw createError({
      statusCode: 400,
      statusMessage: memberPublicKey.error.errors.flat().join(),
    });

  const multisigMembers = await db
    .select()
    .from(tables.multisigMembers)
    .where(eq(tables.multisigMembers.publicKey, memberPublicKey.data));

  const multisigIds = multisigMembers.map((member) => member.multisigId);

  if (multisigIds.length === 0) {
    return [];
  }

  const data = await db
    .select()
    .from(tables.multisigs)
    .where(inArray(tables.multisigs.publicKey, multisigIds));

  return data;
});
