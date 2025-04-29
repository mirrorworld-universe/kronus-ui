ALTER TABLE multisig_members ADD COLUMN permissions TEXT NOT NULL DEFAULT '{"vote": true}';
