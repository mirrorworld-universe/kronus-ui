-- Address Book Table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  description TEXT,
  tags TEXT, -- JSON array stored as TEXT
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Multisig Groups Table
CREATE TABLE IF NOT EXISTS multisigs (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Multisig Members Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS multisig_members (
  multisig_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  contact_id TEXT, -- Optional reference to address book
  role TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (multisig_id) REFERENCES multisigs(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  PRIMARY KEY (multisig_id, public_key)
);

-- Vaults Table
CREATE TABLE IF NOT EXISTS vaults (
  multisig_id TEXT NOT NULL,
  vault_index INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (multisig_id) REFERENCES multisigs(id),
  PRIMARY KEY (multisig_id, vault_index)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  multisig_id TEXT NOT NULL,
  proposer TEXT NOT NULL,
  instructions TEXT NOT NULL, -- JSON stored as TEXT
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (multisig_id) REFERENCES multisigs(id)
);

-- Transaction Signatures Table
CREATE TABLE IF NOT EXISTS transaction_signatures (
  transaction_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  contact_id TEXT, -- Optional reference to address book
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  PRIMARY KEY (transaction_id, public_key)
);
