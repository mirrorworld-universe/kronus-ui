CREATE TABLE IF NOT EXISTS "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"public_key" text NOT NULL,
	"description" text,
	"tags" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contacts_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "multisig_members" (
	"multisig_id" text NOT NULL,
	"public_key" text NOT NULL,
	CONSTRAINT "multisig_members_multisig_id_public_key_pk" PRIMARY KEY("multisig_id","public_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "multisigs" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"name" text NOT NULL,
	"threshold" integer NOT NULL,
	"creator" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "multisigs_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_signatures" (
	"transaction_id" text NOT NULL,
	"public_key" text NOT NULL,
	"contact_id" text,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "transaction_signatures_transaction_id_public_key_pk" PRIMARY KEY("transaction_id","public_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"multisig_id" text NOT NULL,
	"vault_index" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vaults" (
	"multisig_id" text NOT NULL,
	"vault_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vaults_multisig_id_vault_index_pk" PRIMARY KEY("multisig_id","vault_index")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "multisig_members" ADD CONSTRAINT "multisig_members_multisig_id_multisigs_id_fk" FOREIGN KEY ("multisig_id") REFERENCES "multisigs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_signatures" ADD CONSTRAINT "transaction_signatures_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_signatures" ADD CONSTRAINT "transaction_signatures_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_multisig_id_multisigs_id_fk" FOREIGN KEY ("multisig_id") REFERENCES "multisigs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vaults" ADD CONSTRAINT "vaults_multisig_id_multisigs_id_fk" FOREIGN KEY ("multisig_id") REFERENCES "multisigs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
