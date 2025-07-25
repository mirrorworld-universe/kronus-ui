CREATE TABLE "testnet_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"public_key" text NOT NULL,
	"description" text,
	"tags" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "testnet_contacts_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE "testnet_multisig_members" (
	"multisig_id" text NOT NULL,
	"public_key" text NOT NULL,
	CONSTRAINT "testnet_multisig_members_multisig_id_public_key_pk" PRIMARY KEY("multisig_id","public_key")
);
--> statement-breakpoint
CREATE TABLE "testnet_multisigs" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"create_key" text NOT NULL,
	"first_vault" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"threshold" integer NOT NULL,
	"creator" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "testnet_multisigs_public_key_unique" UNIQUE("public_key"),
	CONSTRAINT "testnet_multisigs_create_key_unique" UNIQUE("create_key"),
	CONSTRAINT "testnet_multisigs_first_vault_unique" UNIQUE("first_vault")
);
--> statement-breakpoint
CREATE TABLE "testnet_transaction_signatures" (
	"transaction_id" text NOT NULL,
	"public_key" text NOT NULL,
	"metadata" json NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "testnet_transaction_signatures_transaction_id_public_key_pk" PRIMARY KEY("transaction_id","public_key")
);
--> statement-breakpoint
CREATE TABLE "testnet_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_pda" text NOT NULL,
	"multisig_id" text NOT NULL,
	"vault_index" integer NOT NULL,
	"vault_account" text NOT NULL,
	"metadata" json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testnet_vaults" (
	"multisig_id" text NOT NULL,
	"vault_index" integer NOT NULL,
	"name" text NOT NULL,
	"public_key" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "testnet_vaults_multisig_id_vault_index_pk" PRIMARY KEY("multisig_id","vault_index")
);
--> statement-breakpoint
ALTER TABLE "testnet_multisig_members" ADD CONSTRAINT "testnet_multisig_members_multisig_id_testnet_multisigs_id_fk" FOREIGN KEY ("multisig_id") REFERENCES "public"."testnet_multisigs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testnet_transaction_signatures" ADD CONSTRAINT "testnet_transaction_signatures_transaction_id_testnet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."testnet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testnet_transactions" ADD CONSTRAINT "testnet_transactions_multisig_id_testnet_multisigs_id_fk" FOREIGN KEY ("multisig_id") REFERENCES "public"."testnet_multisigs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testnet_vaults" ADD CONSTRAINT "testnet_vaults_multisig_id_testnet_multisigs_id_fk" FOREIGN KEY ("multisig_id") REFERENCES "public"."testnet_multisigs"("id") ON DELETE no action ON UPDATE no action;