"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const soilTextures = ["sandy","loamy_sand","loam","silty","clay_loam","clay","unknown"];
const drainageClasses = ["well_drained","moderate","poor","unknown"];

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
function optionalNumber(raw: string) {
  if (!raw) return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : NaN;
}

export async function createFarm(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = value(formData,"organization_id");
  const name = value(formData,"name");
  const location = value(formData,"location_label");
  const latitude = optionalNumber(value(formData,"latitude"));
  const longitude = optionalNumber(value(formData,"longitude"));
  const area = optionalNumber(value(formData,"area_hectares"));
  const soilPh = optionalNumber(value(formData,"soil_ph"));
  const organicMatter = optionalNumber(value(formData,"organic_matter_pct"));
  const soilTexture = value(formData,"soil_texture");
  const drainage = value(formData,"drainage_class");
  const currentCrop = value(formData,"current_crop");
  const soilSource = value(formData,"soil_data_source");
  const soilObservedAt = value(formData,"soil_observed_at");
  const notes = value(formData,"notes");

  if (name.length < 2 || name.length > 120) redirect("/farms?error=O%20nome%20deve%20ter%20entre%202%20e%20120%20caracteres.");
  if (!organizationId) redirect("/farms?error=Selecione%20uma%20organização.");
  if (!Number.isFinite(latitude) || latitude! < -90 || latitude! > 90 ||
      !Number.isFinite(longitude) || longitude! < -180 || longitude! > 180) {
    redirect("/farms?error=Indique%20coordenadas%20válidas.");
  }
  if (area !== null && (!Number.isFinite(area) || area <= 0)) redirect("/farms?error=A%20área%20deve%20ser%20positiva.");
  if (soilPh !== null && (!Number.isFinite(soilPh) || soilPh < 0 || soilPh > 14)) redirect("/farms?error=O%20pH%20deve%20estar%20entre%200%20e%2014.");
  if (organicMatter !== null && (!Number.isFinite(organicMatter) || organicMatter < 0 || organicMatter > 100)) redirect("/farms?error=A%20matéria%20orgânica%20deve%20estar%20entre%200%20e%20100%25.");
  if (soilTexture && !soilTextures.includes(soilTexture)) redirect("/farms?error=Textura%20de%20solo%20inválida.");
  if (drainage && !drainageClasses.includes(drainage)) redirect("/farms?error=Classe%20de%20drenagem%20inválida.");
  if (soilObservedAt && !/^\d{4}-\d{2}-\d{2}$/.test(soilObservedAt)) redirect("/farms?error=Data%20de%20observação%20inválida.");

  const { error } = await supabase.from("farms").insert({
    organization_id: organizationId,
    name,
    location_label: location || null,
    latitude,
    longitude,
    area_hectares: area,
    soil_texture: soilTexture || null,
    soil_ph: soilPh,
    organic_matter_pct: organicMatter,
    drainage_class: drainage || null,
    current_crop: currentCrop || null,
    soil_data_source: soilSource || null,
    soil_observed_at: soilObservedAt || null,
    notes: notes || null,
    created_by: user.id,
  });
  if (error) redirect("/farms?error=Não%20foi%20possível%20guardar%20a%20exploração.%20Verifique%20as%20suas%20permissões.");
  revalidatePath("/farms");
  revalidatePath("/dashboard");
  redirect("/farms?saved=1");
}

export async function deleteFarm(formData: FormData) {
  const id = value(formData,"farm_id");
  if (!id) redirect("/farms?error=Identificador%20da%20exploração%20em%20falta.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("farms").delete().eq("id",id);
  if (error) redirect("/farms?error=Não%20foi%20possível%20remover%20a%20exploração.%20Confirme%20as%20permissões.");
  revalidatePath("/farms");
  revalidatePath("/dashboard");
  redirect("/farms?deleted=1");
}
