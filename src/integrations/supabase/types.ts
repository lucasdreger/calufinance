export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget_plans: {
        Row: {
          category_id: string
          created_at: string
          description: string
          estimated_amount: number
          id: string
          is_fixed: boolean
          owner: string
          requires_status: boolean | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description: string
          estimated_amount: number
          id?: string
          is_fixed?: boolean
          owner: string
          requires_status?: boolean | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          estimated_amount?: number
          id?: string
          is_fixed?: boolean
          owner?: string
          requires_status?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expenses_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_fixed: boolean | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_fixed?: boolean | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_fixed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expenses_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          planned_budget: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          planned_budget?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          planned_budget?: number
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses_status: {
        Row: {
          budget_plan_id: string
          completed_at: string | null
          created_at: string
          date: string
          id: string
          is_paid: boolean
          user_id: string
        }
        Insert: {
          budget_plan_id: string
          completed_at?: string | null
          created_at?: string
          date: string
          id?: string
          is_paid?: boolean
          user_id: string
        }
        Update: {
          budget_plan_id?: string
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          is_paid?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_status_budget_plan_id_fkey"
            columns: ["budget_plan_id"]
            isOneToOne: false
            referencedRelation: "budget_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          is_default: boolean | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          is_default?: boolean | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          is_default?: boolean | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string | null
          current_value: number
          id: string
          initial_value: number
          last_updated: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          id?: string
          initial_value?: number
          last_updated?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          id?: string
          initial_value?: number
          last_updated?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_income: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: number
          source: string
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month: number
          source: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: number
          source?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_tasks: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          month: number
          task_id: string
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          month: number
          task_id: string
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          month?: number
          task_id?: string
          updated_at?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reserves: {
        Row: {
          created_at: string | null
          current_value: number
          id: string
          last_updated: string | null
          target_value: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          id?: string
          last_updated?: string | null
          target_value?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          id?: string
          last_updated?: string | null
          target_value?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_credit_card_expenses_for_user: {
        Args: {
          user_uuid: string
        }
        Returns: undefined
      }
      ensure_amex_category: {
        Args: {
          user_uuid: string
        }
        Returns: string
      }
      get_credit_card_data: {
        Args: {
          p_user_id: string
          p_year: number
          p_month: number
        }
        Returns: {
          credit_card_amount: number
          transfer_amount: number
          is_transfer_completed: boolean
        }[]
      }
      get_financial_overview: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          month_key: string
          total_income: number
          total_expenses: number
        }[]
      }
      get_fixed_expenses_status: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_tasks: number
          completed_tasks: number
          all_completed: boolean
        }[]
      }
      insert_default_categories: {
        Args: {
          user_uuid: string
        }
        Returns: undefined
      }
      upsert_monthly_income: {
        Args: {
          p_user_id: string
          p_year: number
          p_month: number
          p_lucas_amount: number
          p_camila_amount: number
          p_other_amount: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
