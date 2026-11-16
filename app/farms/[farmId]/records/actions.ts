"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const recordTypes = ["planting","harvest","field_observation","pest_disease","fertilizer","treatment","yield","other"];
const statuses = ["observed","suspected","confirmed","not_applicable"];
const sources = ["farmer_report","field_observation","agronomist_report","laboratory"];
const get = (data:FormData,key:string) => String(data.get(key)??"").trim();
const numberOrNull = (raw:string) => raw==="" ? null : (Number.isFinite(Number(raw)) ? Number(raw) : NaN);

export async function createAgriculturalRecord(formData:FormData) {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const farmId=get(formData,"farm_id");
  const type=get(formData,"record_type");
  const title=get(formData,"title");
  const date=get(formData,"occurred_at");
  const description=get(formData,"description");
  const crop=get(formData,"crop");
  const status=get(formData,"observation_status");
  const inputName=get(formData,"input_name");
  const inputQuantity=numberOrNull(get(formData,"input_quantity"));
  const inputUnit=get(formData,"input_unit");
  const yieldQuantity=numberOrNull(get(formData,"yield_quantity"));
  const yieldUnit=get(formData,"yield_unit");
  const source=get(formData,"source")||"farmer_report";

  if(!farmId || !recordTypes.includes(type) || title.length<2 || title.length>160) redirect("/farms?error=Verifique%20o%20tipo%20e%20o%20título%20do%20registo.");
  if(status && !statuses.includes(status)) redirect("/farms?error=Estado%20de%20observação%20inválido.");
  if(!sources.includes(source)) redirect("/farms?error=Origem%20da%20informação%20inválida.");
  if((inputQuantity!==null && (!Number.isFinite(inputQuantity)||inputQuantity<0)) || (yieldQuantity!==null && (!Number.isFinite(yieldQuantity)||yieldQuantity<0))) redirect("/farms?error=As%20quantidades%20devem%20ser%20positivas.");
  if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/farms?error=Data%20inválida.");

  const {data:farm,error:farmError}=await supabase.from("farms").select("id,organization_id").eq("id",farmId).single();
  if(farmError||!farm) redirect("/farms?error=Exploração%20não%20encontrada%20ou%20sem%20permissão.");
  const {error}=await supabase.from("agricultural_records").insert({
    farm_id:farm.id, organization_id:farm.organization_id, record_type:type, title,
    description:description||null, occurred_at:date||new Date().toISOString().slice(0,10),
    crop:crop||null, observation_status:status||null, input_name:inputName||null,
    input_quantity:inputQuantity, input_unit:inputUnit||null,
    yield_quantity:yieldQuantity, yield_unit:yieldUnit||null, source, created_by:user.id
  });
  if(error) redirect("/farms?error=Não%20foi%20possível%20guardar%20o%20registo.%20Verifique%20as%20permissões.");
  revalidatePath("/farms/"+farmId+"/records");
  revalidatePath("/insights");
  redirect("/farms/"+farmId+"/records?saved=1");
}
