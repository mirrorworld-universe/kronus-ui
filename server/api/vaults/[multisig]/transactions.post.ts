import { z } from "zod";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import { db } from "../../../db";
import {
  solanaPublicKey,
  createTransactionSchema,
  TransactionType,
} from "~~/server/validations/schemas";
import { connectionManager } from "~/utils/connection.manager";
import {
  getNetworkFromQuery,
  getTablesByNetwork,
} from "../../../db/network-tables";

const { Multisig } = multisig.accounts;

export default eventHandler(async (event) => {
  try {
    const serverNetwork = connectionManager.getNetwork();

    const multisig = getRouterParam(event, "multisig");
    const query = getQuery(event);
    const network = getNetworkFromQuery(query);
    const tables = getTablesByNetwork(network);

    if (serverNetwork !== network) {
      connectionManager.setNetwork(network);
    }

    const multisigPublicKey = solanaPublicKey.safeParse(multisig);
    // Validate that the multisig account exists

    if (multisigPublicKey.error)
      throw createError({
        statusCode: 400,
        statusMessage: multisigPublicKey.error.errors.flat().join(),
      });

    const connection = connectionManager.getCurrentConnection();
    let multisigAccount;
    try {
      multisigAccount = await Multisig.fromAccountAddress(
        connection,
        new PublicKey(multisigPublicKey.data)
      );
    } catch (error) {
      console.error("Failed to fetch multisig account:", error, `on ${network}`);
      throw createError({
        statusCode: 404,
        statusMessage: `Unable to find Multisig account at ${multisigPublicKey.data} on ${network}`,
      });
    }

    if (!multisigAccount)
      throw createError({
        statusCode: 500,
        statusMessage: `Could not find multisig with address ${multisigPublicKey.data}`,
      });

    const body = await readBody(event);

    // Validate request body
    const validatedData = createTransactionSchema.parse({
      multisig_id: multisigPublicKey.data,
      vault_index: body.vault_index,
      transaction_pda: body.transaction_pda,
      vault_account: body.vault_account,
      metadata: body.metadata || {
        type: TransactionType.Arbitrary,
      },
    });

    // Insert the new transaction into the database
    const vault = await db
      .insert(tables.transactions)
      .values({
        id: validatedData.transaction_pda,
        multisigId: validatedData.multisig_id,
        transactionPda: validatedData.transaction_pda,
        vaultIndex: validatedData.vault_index,
        vaultAccount: validatedData.vault_account,
        metadata: validatedData.metadata,
      })
      .returning();

    return vault[0];
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
