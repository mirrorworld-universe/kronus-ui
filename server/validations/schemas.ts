import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

// Custom validator for Solana public keys
export const solanaPublicKey = z.string().refine((val) => {
  try {
    new PublicKey(val);
    return true;
  } catch {
    return false;
  }
}, "Invalid Solana public key");

// Validation schema for multisig creation
export const createMultisigSchema = z
  .object({
    address: solanaPublicKey,
    creator_address: solanaPublicKey,
    create_key: solanaPublicKey,
    first_vault: solanaPublicKey,
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    threshold: z.number().int().positive("Threshold must be positive"),
    members: z
      .array(
        z.object({
          address: solanaPublicKey,
          label: z.string().optional(),
        })
      )
      .min(1, "At least one member is required"),
  })
  .refine(
    (data) => {
      // Ensure threshold is not greater than number of members
      return data.threshold <= data.members.length;
    },
    {
      message: "Threshold cannot be greater than number of members",
      path: ["threshold"],
    }
  )
  .refine(
    (data) => {
      // Ensure all member addresses are unique
      const addresses = data.members.map((m) => m.address);
      return new Set(addresses).size === addresses.length;
    },
    {
      message: "Member addresses must be unique",
      path: ["members"],
    }
  );

// Validation schema for cault creation
export const createVaultSchema = z.object({
  multisig_id: solanaPublicKey,
  vault_index: z.number().int().positive("Vault index must be positive"),
  public_key: solanaPublicKey,
  name: z.string().min(1, "Name is required"),
});

// Validation schema for vault update
export const updateVaultSchema = z.object({
  multisig_id: solanaPublicKey,
  vault_index: z.number().int().positive("Vault index must be positive"),
  public_key: solanaPublicKey,
  name: z.string().min(1, "Name is required"),
});

// Validation schema for vault importing
export const importVaultsSchema = z.array(
  z.object({
    multisig_id: solanaPublicKey,
    vault_index: z.number().int().min(0),
    public_key: solanaPublicKey,
    name: z.string().min(1, "Name is required"),
  })
);

// Validation schema for multisig import
export const importMultisigSchema = z
  .object({
    address: solanaPublicKey,
    creator_address: solanaPublicKey,
    create_key: solanaPublicKey,
    first_vault: solanaPublicKey,
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    threshold: z.number().int().positive("Threshold must be positive"),
    members: z
      .array(
        z.object({
          address: solanaPublicKey,
          label: z.string().optional(),
        })
      )
      .min(1, "At least one member is required"),
    vaults: importVaultsSchema,
  })
  .refine(
    (data) => {
      // Ensure threshold is not greater than number of members
      return data.threshold <= data.members.length;
    },
    {
      message: "Threshold cannot be greater than number of members",
      path: ["threshold"],
    }
  )
  .refine(
    (data) => {
      // Ensure all member addresses are unique
      const addresses = data.members.map((m) => m.address);
      return new Set(addresses).size === addresses.length;
    },
    {
      message: "Member addresses must be unique",
      path: ["members"],
    }
  );

export enum TransactionType {
  Send = "Send",
  Arbitrary = "Arbitrary",
}
export enum TransferType {
  VaultToExternal = "VaultToExternal",
  VaultToVault = "VaultToVault",
}
export enum TransferAssetType {
  SOL = "SOL",
  SPL = "SPL",
}

// Validation schema for transaction creation
export const createTransactionSchema = z.object({
  multisig_id: solanaPublicKey,
  transaction_pda: solanaPublicKey,
  vault_index: z.number().int().min(0),
  vault_account: solanaPublicKey,
  metadata: z.object({
    type: z.nativeEnum(TransactionType),
    description: z.string().optional(),
    transferType: z.nativeEnum(TransferType).optional(),
    assetType: z.nativeEnum(TransferAssetType).optional(),
    amount: z.number(),
    tokenMint: solanaPublicKey,
  }),
});
