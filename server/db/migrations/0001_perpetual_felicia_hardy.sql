ALTER TABLE "transaction_signatures" DROP CONSTRAINT "transaction_signatures_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "multisigs" ADD COLUMN "create_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "multisigs" ADD COLUMN "first_vault" text NOT NULL;--> statement-breakpoint
ALTER TABLE "multisigs" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "transaction_signatures" ADD COLUMN "metadata" json NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transaction_pda" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "vault_account" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "metadata" json NOT NULL;--> statement-breakpoint
ALTER TABLE "vaults" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vaults" ADD COLUMN "public_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_signatures" DROP COLUMN "contact_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "multisigs" ADD CONSTRAINT "multisigs_create_key_unique" UNIQUE("create_key");--> statement-breakpoint
ALTER TABLE "multisigs" ADD CONSTRAINT "multisigs_first_vault_unique" UNIQUE("first_vault");