import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (membershipError) return NextResponse.json({ error: "Could not load organization access." }, { status: 500 });

  const organizationIds = (memberships ?? []).map((item) => item.organization_id);
  if (!organizationIds.length) return NextResponse.json({ farms: [] });

  const { data: farms, error } = await supabase
    .from("farms")
    .select("id,name,latitude,longitude,area_hectares,soil_texture,soil_ph,organic_matter_pct,drainage_class,current_crop")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load farm records." }, { status: 500 });
  return NextResponse.json({ farms: farms ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}
