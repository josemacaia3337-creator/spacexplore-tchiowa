import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, organization_id")
    .eq("id", farmId)
    .maybeSingle();
  if (farmError) return NextResponse.json({ error: "Could not verify farm access." }, { status: 500 });
  if (!farm) return NextResponse.json({ error: "Farm not found." }, { status: 404 });

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("organization_id", farm.organization_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) return NextResponse.json({ error: "Could not verify organization access." }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "Farm access denied." }, { status: 403 });

  const { data: records, error } = await supabase
    .from("agricultural_records")
    .select("id,record_type,title,description,occurred_at,crop,observation_status,input_name,input_quantity,input_unit,yield_quantity,yield_unit,source")
    .eq("farm_id", farmId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Could not load agricultural history." }, { status: 500 });

  return NextResponse.json({ records: records ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}
