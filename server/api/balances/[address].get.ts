import { solanaPublicKey } from "~~/server/validations/schemas";
import { getTokenBalances, formatBalances } from "~~/app/utils/token-balances";

export default eventHandler(async (event) => {
  const address = getRouterParam(event, "address");

  const addressPublicKey = solanaPublicKey.safeParse(address);
  if (addressPublicKey.error) throw createError({
    statusCode: 400,
    statusMessage: addressPublicKey.error.errors.flat().join(),
  });

  const balances = await getTokenBalances(addressPublicKey.data);
  const formattedBalances = formatBalances(balances);
  return formattedBalances;
});
