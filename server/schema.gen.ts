export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          public_key: string
          tags: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          public_key: string
          tags?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          public_key?: string
          tags?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      multisig_members: {
        Row: {
          multisig_id: string
          public_key: string
        }
        Insert: {
          multisig_id: string
          public_key: string
        }
        Update: {
          multisig_id?: string
          public_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "multisig_members_multisig_id_multisigs_id_fk"
            columns: ["multisig_id"]
            isOneToOne: false
            referencedRelation: "multisigs"
            referencedColumns: ["id"]
          },
        ]
      }
      multisigs: {
        Row: {
          create_key: string
          created_at: string | null
          creator: string
          description: string | null
          first_vault: string
          id: string
          name: string
          public_key: string
          threshold: number
          updated_at: string | null
        }
        Insert: {
          create_key: string
          created_at?: string | null
          creator: string
          description?: string | null
          first_vault: string
          id: string
          name: string
          public_key: string
          threshold: number
          updated_at?: string | null
        }
        Update: {
          create_key?: string
          created_at?: string | null
          creator?: string
          description?: string | null
          first_vault?: string
          id?: string
          name?: string
          public_key?: string
          threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_signatures: {
        Row: {
          contact_id: string | null
          public_key: string
          timestamp: string | null
          transaction_id: string
        }
        Insert: {
          contact_id?: string | null
          public_key: string
          timestamp?: string | null
          transaction_id: string
        }
        Update: {
          contact_id?: string | null
          public_key?: string
          timestamp?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_signatures_contact_id_contacts_id_fk"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_signatures_transaction_id_transactions_id_fk"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          id: string
          multisig_id: string
          status: string
          updated_at: string | null
          vault_index: number
        }
        Insert: {
          created_at?: string | null
          id: string
          multisig_id: string
          status: string
          updated_at?: string | null
          vault_index: number
        }
        Update: {
          created_at?: string | null
          id?: string
          multisig_id?: string
          status?: string
          updated_at?: string | null
          vault_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_multisig_id_multisigs_id_fk"
            columns: ["multisig_id"]
            isOneToOne: false
            referencedRelation: "multisigs"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          created_at: string | null
          multisig_id: string
          name: string
          public_key: string
          vault_index: number
        }
        Insert: {
          created_at?: string | null
          multisig_id: string
          name: string
          public_key: string
          vault_index: number
        }
        Update: {
          created_at?: string | null
          multisig_id?: string
          name?: string
          public_key?: string
          vault_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "vaults_multisig_id_multisigs_id_fk"
            columns: ["multisig_id"]
            isOneToOne: false
            referencedRelation: "multisigs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

