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
      agricultural_records: {
        Row: { id: string; farm_id: string; organization_id: string; record_type: string; title: string; description: string | null; occurred_at: string; crop: string | null; observation_status: string | null; input_name: string | null; input_quantity: number | null; input_unit: string | null; yield_quantity: number | null; yield_unit: string | null; source: string; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; farm_id: string; organization_id: string; record_type: string; title: string; description?: string | null; occurred_at?: string; crop?: string | null; observation_status?: string | null; input_name?: string | null; input_quantity?: number | null; input_unit?: string | null; yield_quantity?: number | null; yield_unit?: string | null; source?: string; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; farm_id?: string; organization_id?: string; record_type?: string; title?: string; description?: string | null; occurred_at?: string; crop?: string | null; observation_status?: string | null; input_name?: string | null; input_quantity?: number | null; input_unit?: string | null; yield_quantity?: number | null; yield_unit?: string | null; source?: string; created_by?: string; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "agricultural_records_farm_org_fk"; columns: ["farm_id", "organization_id"]; isOneToOne: false; referencedRelation: "farms"; referencedColumns: ["id", "organization_id"] }];
      };
      farms: {
        Row: { id: string; organization_id: string; name: string; location_label: string | null; latitude: number | null; longitude: number | null; area_hectares: number | null; boundary_area_hectares: number | null; soil_texture: string | null; soil_ph: number | null; organic_matter_pct: number | null; drainage_class: string | null; current_crop: string | null; soil_data_source: string | null; soil_observed_at: string | null; notes: string | null; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; name: string; location_label?: string | null; latitude?: number | null; longitude?: number | null; area_hectares?: number | null; boundary_area_hectares?: number | null; soil_texture?: string | null; soil_ph?: number | null; organic_matter_pct?: number | null; drainage_class?: string | null; current_crop?: string | null; soil_data_source?: string | null; soil_observed_at?: string | null; notes?: string | null; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string; name?: string; location_label?: string | null; latitude?: number | null; longitude?: number | null; area_hectares?: number | null; boundary_area_hectares?: number | null; soil_texture?: string | null; soil_ph?: number | null; organic_matter_pct?: number | null; drainage_class?: string | null; current_crop?: string | null; soil_data_source?: string | null; soil_observed_at?: string | null; notes?: string | null; created_by?: string; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "farms_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: { create_organization_with_owner: { Args: { org_name: string; org_slug: string }; Returns: string }; save_farm_boundary: { Args: { p_farm_id: string; p_geojson: Json }; Returns: { boundary_geojson: Json; boundary_area_hectares: number }[] }; get_farm_boundary: { Args: { p_farm_id: string }; Returns: { boundary_geojson: Json | null; boundary_area_hectares: number | null }[] } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
