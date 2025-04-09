-- Address Book Table
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  description TEXT,
  tags TEXT[], -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Multisig Groups Table
CREATE TABLE multisigs (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Multisig Members Table (Many-to-Many relationship)
CREATE TABLE multisig_members (
  multisig_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  contact_id TEXT, -- Optional reference to address book
  role TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (multisig_id) REFERENCES multisigs(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  PRIMARY KEY (multisig_id, public_key)
);

-- Transactions Table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  multisig_id TEXT NOT NULL,
  proposer TEXT NOT NULL,
  instructions JSON NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (multisig_id) REFERENCES multisigs(id)
);

-- Transaction Signatures Table
CREATE TABLE transaction_signatures (
  transaction_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  contact_id TEXT, -- Optional reference to address book
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  PRIMARY KEY (transaction_id, public_key)
);