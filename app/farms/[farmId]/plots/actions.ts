"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const get = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const cycleStatuses = ["planned", "planted", "growing", "harvested", "failed", "cancelled"];

export async function createFarmPlot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const farmId=get(formData,"farm_id"), name=get(formData,"name"), cropName=get(formData,"crop_name");
  const variety=get(formData,"variety"), plantingDate=get(formData,"planting_date");
  const expectedHarvestDate=get(formData,"expected_harvest_date"), cropStatus=get(formData,"crop_status")||"planned";
  const notes=get(formData,"notes"), rawGeometry=get(formData,"boundary_geojson");
  if(!farmId||name.length<2||name.length>100||cropName.length<2||cropName.length>100) redirect("/farms?error=Preencha%20o%20nome%20do%20talhão%20e%20a%20cultura.");
  if(!rawGeometry||rawGeometry.length>200000) redirect(`/farms/${farmId}/plots?error=Desenhe%20os%20limites%20do%20talhão%20no%20mapa.`);
  if(!cycleStatuses.slice(0,3).includes(cropStatus)) redirect(`/farms/${farmId}/plots?error=Estado%20inicial%20da%20cultura%20inválido.`);
  if(plantingDate&&!/^\d{4}-\d{2}-\d{2}$/.test(plantingDate)) redirect(`/farms/${farmId}/plots?error=Data%20de%20plantio%20inválida.`);
  if(expectedHarvestDate&&!/^\d{4}-\d{2}-\d{2}$/.test(expectedHarvestDate)) redirect(`/farms/${farmId}/plots?error=Data%20prevista%20de%20colheita%20inválida.`);
  if(["planted","growing"].includes(cropStatus)&&!plantingDate) redirect(`/farms/${farmId}/plots?error=Indique%20a%20data%20de%20plantio.`);
  if(plantingDate&&expectedHarvestDate&&expectedHarvestDate<plantingDate) redirect(`/farms/${farmId}/plots?error=A%20colheita%20prevista%20não%20pode%20anteceder%20o%20plantio.`);
  let geometry:unknown;
  try{geometry=JSON.parse(rawGeometry);}catch{redirect(`/farms/${farmId}/plots?error=O%20polígono%20não%20está%20num%20formato%20válido.`);}
  if(!geometry||typeof geometry!=="object"||(geometry as {type?:string}).type!=="Polygon") redirect(`/farms/${farmId}/plots?error=A%20delimitação%20deve%20ser%20um%20polígono.`);
  const {data,error}=await supabase.rpc("create_farm_plot",{
    p_farm_id:farmId,p_name:name,p_geojson:geometry as import("@/types/supabase").Json,
    p_crop_name:cropName,p_variety:variety||undefined,p_planting_date:plantingDate||undefined,
    p_expected_harvest_date:expectedHarvestDate||undefined,p_crop_status:cropStatus,p_notes:notes||undefined,
  });
  if(error||!data?.length) redirect(`/farms/${farmId}/plots?error=${encodeURIComponent(error?.message??"Não foi possível guardar o talhão.")}`);
  revalidatePath("/farms");revalidatePath(`/farms/${farmId}/plots`);revalidatePath(`/farms/${farmId}/records`);revalidatePath("/dashboard");
  redirect(`/farms/${farmId}/plots?saved=1`);
}

export async function createFarmCropCycle(formData:FormData) {
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const farmId=get(formData,"farm_id"),plotId=get(formData,"plot_id"),cropName=get(formData,"crop_name");
  const variety=get(formData,"variety"),plantingDate=get(formData,"planting_date"),expectedHarvestDate=get(formData,"expected_harvest_date");
  const status=get(formData,"status")||"planned",notes=get(formData,"notes");
  if(!farmId||!plotId||cropName.length<2||cropName.length>100||!cycleStatuses.slice(0,3).includes(status)) redirect(`/farms/${farmId}/plots?error=Verifique%20a%20cultura%20e%20o%20estado%20do%20novo%20ciclo.`);
  if(plantingDate&&!/^\d{4}-\d{2}-\d{2}$/.test(plantingDate))redirect(`/farms/${farmId}/plots?error=Data%20de%20plantio%20inválida.`);
  if(expectedHarvestDate&&!/^\d{4}-\d{2}-\d{2}$/.test(expectedHarvestDate))redirect(`/farms/${farmId}/plots?error=Data%20prevista%20inválida.`);
  if(["planted","growing"].includes(status)&&!plantingDate)redirect(`/farms/${farmId}/plots?error=Indique%20a%20data%20de%20plantio.`);
  if(plantingDate&&expectedHarvestDate&&expectedHarvestDate<plantingDate)redirect(`/farms/${farmId}/plots?error=A%20colheita%20prevista%20não%20pode%20anteceder%20o%20plantio.`);
  const {data:plot,error:plotError}=await supabase.from("farm_plots").select("id,farm_id,organization_id").eq("id",plotId).eq("farm_id",farmId).maybeSingle();
  if(plotError||!plot)redirect(`/farms/${farmId}/plots?error=Talhão%20não%20encontrado%20ou%20sem%20permissão.`);
  const {error}=await supabase.from("farm_crop_cycles").insert({
    plot_id:plot.id,farm_id:plot.farm_id,organization_id:plot.organization_id,crop_name:cropName,
    variety:variety||null,planting_date:plantingDate||null,expected_harvest_date:expectedHarvestDate||null,
    status,notes:notes||null,source:"farmer_report",created_by:user.id,
  });
  if(error)redirect(`/farms/${farmId}/plots?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/farms/${farmId}/plots`);revalidatePath(`/farms/${farmId}/records`);revalidatePath("/insights");
  redirect(`/farms/${farmId}/plots?saved=cycle`);
}

export async function updateFarmCropCycle(formData:FormData) {
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const farmId=get(formData,"farm_id"),cycleId=get(formData,"cycle_id"),status=get(formData,"status"),actualHarvestDate=get(formData,"actual_harvest_date");
  if(!farmId||!cycleId||!cycleStatuses.includes(status))redirect("/farms?error=Estado%20do%20ciclo%20inválido.");
  if(actualHarvestDate&&!/^\d{4}-\d{2}-\d{2}$/.test(actualHarvestDate))redirect(`/farms/${farmId}/plots?error=Data%20real%20de%20colheita%20inválida.`);
  if(status==="harvested"&&!actualHarvestDate)redirect(`/farms/${farmId}/plots?error=Indique%20a%20data%20real%20da%20colheita.`);
  const {data:cycle,error:cycleError}=await supabase.from("farm_crop_cycles").select("id,planting_date").eq("id",cycleId).eq("farm_id",farmId).maybeSingle();
  if(cycleError||!cycle)redirect(`/farms/${farmId}/plots?error=Ciclo%20agrícola%20não%20encontrado.`);
  if(actualHarvestDate&&cycle.planting_date&&actualHarvestDate<cycle.planting_date)redirect(`/farms/${farmId}/plots?error=A%20colheita%20real%20não%20pode%20anteceder%20o%20plantio.`);
  const {error}=await supabase.from("farm_crop_cycles").update({status,actual_harvest_date:status==="harvested"?actualHarvestDate:null,updated_at:new Date().toISOString()}).eq("id",cycleId).eq("farm_id",farmId);
  if(error)redirect(`/farms/${farmId}/plots?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/farms/${farmId}/plots`);revalidatePath(`/farms/${farmId}/records`);revalidatePath("/insights");
  redirect(`/farms/${farmId}/plots?updated=1`);
}
