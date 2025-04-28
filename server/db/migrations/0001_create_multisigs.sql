CREATE TABLE IF NOT EXISTS multisigs (
  address TEXT PRIMARY KEY,
  creator_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  members JSON NOT NULL,
  threshold INTEGER NOT NULL,
  vault_index INTEGER NOT NULL DEFAULT 0
);
