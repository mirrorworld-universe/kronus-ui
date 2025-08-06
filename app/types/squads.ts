import type { InferSelectModel } from "drizzle-orm";
import { vaults, multisigs, multisigMembers, } from "~~/server/db/schema";

export type IVault = InferSelectModel<typeof vaults>;

export type IMultisig = InferSelectModel<typeof multisigs>;

export type IMultisigMember = InferSelectModel<typeof multisigMembers>;
