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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agricultural_records: {
        Row: {
          created_at: string
          created_by: string
          crop: string | null
          crop_cycle_id: string | null
          description: string | null
          farm_id: string
          id: string
          input_name: string | null
          input_quantity: number | null
          input_unit: string | null
          observation_status: string | null
          occurred_at: string
          organization_id: string
          plot_id: string | null
          record_type: string
          source: string
          title: string
          updated_at: string
          yield_quantity: number | null
          yield_unit: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          crop?: string | null
          crop_cycle_id?: string | null
          description?: string | null
          farm_id: string
          id?: string
          input_name?: string | null
          input_quantity?: number | null
          input_unit?: string | null
          observation_status?: string | null
          occurred_at?: string
          organization_id: string
          plot_id?: string | null
          record_type: string
          source?: string
          title: string
          updated_at?: string
          yield_quantity?: number | null
          yield_unit?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          crop?: string | null
          crop_cycle_id?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          input_name?: string | null
          input_quantity?: number | null
          input_unit?: string | null
          observation_status?: string | null
          occurred_at?: string
          organization_id?: string
          plot_id?: string | null
          record_type?: string
          source?: string
          title?: string
          updated_at?: string
          yield_quantity?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agricultural_records_crop_cycle_fk"
            columns: ["crop_cycle_id", "plot_id", "farm_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "farm_crop_cycles"
            referencedColumns: ["id", "plot_id", "farm_id", "organization_id"]
          },
          {
            foreignKeyName: "agricultural_records_farm_org_fk"
            columns: ["farm_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "agricultural_records_plot_fk"
            columns: ["plot_id", "farm_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "farm_plots"
            referencedColumns: ["id", "farm_id", "organization_id"]
          },
        ]
      }
      farm_crop_cycles: {
        Row: {
          actual_harvest_date: string | null
          created_at: string
          created_by: string
          crop_name: string
          expected_harvest_date: string | null
          farm_id: string
          id: string
          notes: string | null
          organization_id: string
          planting_date: string | null
          plot_id: string
          source: string
          status: string
          updated_at: string
          variety: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          created_at?: string
          created_by: string
          crop_name: string
          expected_harvest_date?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          organization_id: string
          planting_date?: string | null
          plot_id: string
          source?: string
          status?: string
          updated_at?: string
          variety?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          created_at?: string
          created_by?: string
          crop_name?: string
          expected_harvest_date?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          planting_date?: string | null
          plot_id?: string
          source?: string
          status?: string
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_crop_cycles_plot_farm_org_fk"
            columns: ["plot_id", "farm_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "farm_plots"
            referencedColumns: ["id", "farm_id", "organization_id"]
          },
        ]
      }
      farm_plots: {
        Row: {
          area_hectares: number
          boundary: unknown
          created_at: string
          created_by: string
          farm_id: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          area_hectares: number
          boundary: unknown
          created_at?: string
          created_by: string
          farm_id: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          area_hectares?: number
          boundary?: unknown
          created_at?: string
          created_by?: string
          farm_id?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_plots_farm_org_fk"
            columns: ["farm_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      farms: {
        Row: {
          area_hectares: number | null
          boundary: unknown
          boundary_area_hectares: number | null
          created_at: string
          created_by: string
          current_crop: string | null
          drainage_class: string | null
          id: string
          latitude: number | null
          location_label: string | null
          longitude: number | null
          name: string
          notes: string | null
          organic_matter_pct: number | null
          organization_id: string
          soil_data_source: string | null
          soil_observed_at: string | null
          soil_ph: number | null
          soil_texture: string | null
          updated_at: string
        }
        Insert: {
          area_hectares?: number | null
          boundary?: unknown
          boundary_area_hectares?: number | null
          created_at?: string
          created_by: string
          current_crop?: string | null
          drainage_class?: string | null
          id?: string
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          organic_matter_pct?: number | null
          organization_id: string
          soil_data_source?: string | null
          soil_observed_at?: string | null
          soil_ph?: number | null
          soil_texture?: string | null
          updated_at?: string
        }
        Update: {
          area_hectares?: number | null
          boundary?: unknown
          boundary_area_hectares?: number | null
          created_at?: string
          created_by?: string
          current_crop?: string | null
          drainage_class?: string | null
          id?: string
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          organic_matter_pct?: number | null
          organization_id?: string
          soil_data_source?: string | null
          soil_observed_at?: string | null
          soil_ph?: number | null
          soil_texture?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_farm_plot: {
        Args: {
          p_crop_name: string
          p_crop_status?: string
          p_expected_harvest_date?: string
          p_farm_id: string
          p_geojson: Json
          p_name: string
          p_notes?: string
          p_planting_date?: string
          p_variety?: string
        }
        Returns: {
          area_hectares: number
          crop_cycle_id: string
          plot_id: string
        }[]
      }
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string }
        Returns: string
      }
      get_farm_boundary: {
        Args: { p_farm_id: string }
        Returns: {
          boundary_area_hectares: number
          boundary_geojson: Json
        }[]
      }
      get_farm_plots: {
        Args: { p_farm_id: string }
        Returns: {
          area_hectares: number
          boundary_geojson: Json
          created_at: string
          id: string
          name: string
          notes: string
        }[]
      }
      save_farm_boundary: {
        Args: { p_farm_id: string; p_geojson: Json }
        Returns: {
          boundary_area_hectares: number
          boundary_geojson: Json
        }[]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
