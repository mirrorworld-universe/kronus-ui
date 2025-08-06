import { eq } from "drizzle-orm";
import { db } from "../../db";
import { solanaPublicKey } from "~~/server/validations/schemas";
import {
  getNetworkFromQuery,
  getTablesByNetwork,
} from "../../db/network-tables";

export default eventHandler(async (event) => {
  const genesis_vault = getRouterParam(event, "genesis_vault");
  const query = getQuery(event);
  const network = getNetworkFromQuery(query);
  const tables = getTablesByNetwork(network);

  const firstVaultPublicKey = solanaPublicKey.safeParse(genesis_vault);
  if (firstVaultPublicKey.error)
    throw createError({
      statusCode: 400,
      statusMessage: firstVaultPublicKey.error.errors.flat().join(),
    });

  const data = await db
    .select()
    .from(tables.multisigs)
    .where(eq(tables.multisigs.firstVault, firstVaultPublicKey.data))
    .limit(1);

  return data[0] || null;
});
