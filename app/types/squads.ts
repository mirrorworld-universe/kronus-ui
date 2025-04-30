export interface Vault {
  created_at: string | null;
  multisig_id: string;
  name: string;
  public_key: string;
  vault_index: number;
}

export interface Multisig {
  create_key: string;
  created_at: string | null;
  creator: string;
  description: string | null;
  first_vault: string;
  id: string;
  name: string;
  public_key: string;
  threshold: number;
  updated_at: string | null;
}
