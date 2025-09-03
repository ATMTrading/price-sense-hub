export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      affiliate_links: {
        Row: {
          affiliate_url: string
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          affiliate_url: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_url?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_networks: {
        Row: {
          api_endpoint: string
          api_key_name: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          market_code: string
          name: string
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          api_key_name: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          market_code: string
          name: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_key_name?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          market_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          css_google_category_id: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_visible: boolean
          market_code: string
          name: string
          nav_order: number | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          css_google_category_id?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_visible?: boolean
          market_code?: string
          name: string
          nav_order?: number | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          css_google_category_id?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_visible?: boolean
          market_code?: string
          name?: string
          nav_order?: number | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "visible_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "visible_categories_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      category_mapping: {
        Row: {
          category_id: string | null
          id: string
          merchant_category: string
          merchant_name: string
        }
        Insert: {
          category_id?: string | null
          id?: string
          merchant_category: string
          merchant_name: string
        }
        Update: {
          category_id?: string | null
          id?: string
          merchant_category?: string
          merchant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      category_mappings: {
        Row: {
          created_at: string
          id: string
          market_code: string
          merchant_category: string
          merchant_name: string
          site_category: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_code: string
          merchant_category: string
          merchant_name: string
          site_category: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          market_code?: string
          merchant_category?: string
          merchant_name?: string
          site_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      feeds: {
        Row: {
          active: boolean
          affiliate_suffix: string | null
          created_at: string
          feed_type: string
          feed_url: string
          id: string
          last_import_at: string | null
          last_status: string | null
          market_code: string
          merchant_name: string
          note: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          affiliate_suffix?: string | null
          created_at?: string
          feed_type?: string
          feed_url: string
          id?: string
          last_import_at?: string | null
          last_status?: string | null
          market_code: string
          merchant_name: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          affiliate_suffix?: string | null
          created_at?: string
          feed_type?: string
          feed_url?: string
          id?: string
          last_import_at?: string | null
          last_status?: string | null
          market_code?: string
          merchant_name?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: Json | null
          feed_id: string | null
          id: string
          import_type: string
          network_id: string | null
          products_created: number | null
          products_processed: number | null
          products_updated: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          feed_id?: string | null
          id?: string
          import_type: string
          network_id?: string | null
          products_created?: number | null
          products_processed?: number | null
          products_updated?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          feed_id?: string | null
          id?: string
          import_type?: string
          network_id?: string | null
          products_created?: number | null
          products_processed?: number | null
          products_updated?: number | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "xml_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "affiliate_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_url: string
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          market_code: string
          merchant_category: string | null
          merchant_feed: string
          merchant_name: string
          price: number
          site_category: string | null
          title: string
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          affiliate_url: string
          category_id?: string | null
          created_at?: string
          currency: string
          description?: string | null
          id?: string
          image_url?: string | null
          market_code: string
          merchant_category?: string | null
          merchant_feed: string
          merchant_name: string
          price: number
          site_category?: string | null
          title: string
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          affiliate_url?: string
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          market_code?: string
          merchant_category?: string | null
          merchant_feed?: string
          merchant_name?: string
          price?: number
          site_category?: string | null
          title?: string
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          affiliate_params: Json | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          market_code: string
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          affiliate_params?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market_code: string
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          affiliate_params?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market_code?: string
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      xml_feeds: {
        Row: {
          affiliate_link_template: Json | null
          created_at: string
          feed_type: string
          id: string
          is_active: boolean
          last_imported_at: string | null
          mapping_config: Json | null
          market_code: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          affiliate_link_template?: Json | null
          created_at?: string
          feed_type?: string
          id?: string
          is_active?: boolean
          last_imported_at?: string | null
          mapping_config?: Json | null
          market_code: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          affiliate_link_template?: Json | null
          created_at?: string
          feed_type?: string
          id?: string
          is_active?: boolean
          last_imported_at?: string | null
          mapping_config?: Json | null
          market_code?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      products_public: {
        Row: {
          affiliate_url: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          image_url: string | null
          market_code: string | null
          price: number | null
          site_category: string | null
          title: string | null
        }
        Insert: {
          affiliate_url?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          image_url?: string | null
          market_code?: string | null
          price?: number | null
          site_category?: string | null
          title?: string | null
        }
        Update: {
          affiliate_url?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          image_url?: string | null
          market_code?: string | null
          price?: number | null
          site_category?: string | null
          title?: string | null
        }
        Relationships: []
      }
      site_products: {
        Row: {
          affiliate_url: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          image_url: string | null
          merchant_category: string | null
          merchant_name: string | null
          price: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      site_products_debug: {
        Row: {
          affiliate_url: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          image_url: string | null
          market_code: string | null
          merchant_category: string | null
          merchant_feed: string | null
          merchant_name: string | null
          price: number | null
          site_category: string | null
          title: string | null
          updated_at: string | null
          visible: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visible_categories_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      site_products_v2: {
        Row: {
          affiliate_url: string | null
          category_slug: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          image_url: string | null
          merchant_category: string | null
          merchant_name: string | null
          price: number | null
          site_category: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      unmapped_categories: {
        Row: {
          market_code: string | null
          merchant_category: string | null
          merchant_name: string | null
          product_count: number | null
        }
        Relationships: []
      }
      visible_categories: {
        Row: {
          id: string | null
          name: string | null
          nav_order: number | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          nav_order?: number | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          nav_order?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      visible_categories_v2: {
        Row: {
          css_google_category_id: number | null
          id: string | null
          name: string | null
          nav_order: number | null
          slug: string | null
        }
        Insert: {
          css_google_category_id?: number | null
          id?: string | null
          name?: string | null
          nav_order?: never
          slug?: string | null
        }
        Update: {
          css_google_category_id?: number | null
          id?: string | null
          name?: string | null
          nav_order?: never
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_scheduled_job: {
        Args: { job_id: number }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_scheduled_jobs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_operation: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      schedule_function_call: {
        Args: {
          cron_schedule: string
          function_args?: Json
          function_name: string
          job_name: string
        }
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      toggle_scheduled_job: {
        Args: { is_active: boolean; job_id: number }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
