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
export const createMultisigSchema = z.object({
  address: solanaPublicKey,
  creator_address: solanaPublicKey,
  name: z.string().min(1, "Name is required"),
  threshold: z.number().int().positive("Threshold must be positive"),
  members: z.array(
    z.object({
      address: solanaPublicKey,
      label: z.string().optional(),
    })
  ).min(1, "At least one member is required")
}).refine((data) => {
  // Ensure threshold is not greater than number of members
  return data.threshold <= data.members.length;
}, {
  message: "Threshold cannot be greater than number of members",
  path: ["threshold"]
}).refine((data) => {
  // Ensure all member addresses are unique
  const addresses = data.members.map(m => m.address);
  return new Set(addresses).size === addresses.length;
}, {
  message: "Member addresses must be unique",
  path: ["members"]
});
