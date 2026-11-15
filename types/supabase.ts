export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar_path: string | null; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; avatar_path?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; avatar_path?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      organizations: {
        Row: { id: string; name: string; slug: string; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; slug?: string; created_by?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      memberships: {
        Row: { id: string; organization_id: string; user_id: string; role: string; status: string; created_at: string };
        Insert: { id?: string; organization_id: string; user_id: string; role: string; status?: string; created_at?: string };
        Update: { id?: string; organization_id?: string; user_id?: string; role?: string; status?: string; created_at?: string };
        Relationships: [{ foreignKeyName: "memberships_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      farms: {
        Row: { id: string; organization_id: string; name: string; location_label: string | null; latitude: number | null; longitude: number | null; area_hectares: number | null; soil_texture: string | null; soil_ph: number | null; organic_matter_pct: number | null; drainage_class: string | null; current_crop: string | null; soil_data_source: string | null; soil_observed_at: string | null; notes: string | null; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; name: string; location_label?: string | null; latitude?: number | null; longitude?: number | null; area_hectares?: number | null; soil_texture?: string | null; soil_ph?: number | null; organic_matter_pct?: number | null; drainage_class?: string | null; current_crop?: string | null; soil_data_source?: string | null; soil_observed_at?: string | null; notes?: string | null; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string; name?: string; location_label?: string | null; latitude?: number | null; longitude?: number | null; area_hectares?: number | null; soil_texture?: string | null; soil_ph?: number | null; organic_matter_pct?: number | null; drainage_class?: string | null; current_crop?: string | null; soil_data_source?: string | null; soil_observed_at?: string | null; notes?: string | null; created_by?: string; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "farms_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: { create_organization_with_owner: { Args: { org_name: string; org_slug: string }; Returns: string } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
