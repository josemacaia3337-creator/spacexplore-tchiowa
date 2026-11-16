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
  const rawBoundary = value(formData,"boundary_geojson");
  let boundaryGeometry: import("@/types/supabase").Json | null = null;
  if (rawBoundary) {
    if (rawBoundary.length > 200000) redirect("/farms?error=O%20desenho%20da%20delimitação%20é%20demasiado%20grande.");
    let parsed: { type?: string; coordinates?: unknown };
    try {
      parsed = JSON.parse(rawBoundary) as { type?: string; coordinates?: unknown };
    } catch {
      redirect("/farms?error=A%20delimitação%20não%20está%20num%20formato%20válido.");
    }
    const rings = parsed.coordinates;
    if (parsed.type !== "Polygon" || !Array.isArray(rings) || !Array.isArray(rings[0]) || rings[0].length < 4) {
      redirect("/farms?error=Desenhe%20um%20polígono%20válido%20com%20pelo%20menos%20três%20pontos.");
    }
    const ring = rings[0] as unknown[];
    const positions = ring.map((point) => Array.isArray(point) ? point.map(Number) : []);
    if (positions.some((point) => point.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || point[0] < -180 || point[0] > 180 || point[1] < -90 || point[1] > 90)) {
      redirect("/farms?error=O%20polígono%20contém%20coordenadas%20inválidas.");
    }
    const first = positions[0];
    const last = positions[positions.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) redirect("/farms?error=O%20polígono%20deve%20estar%20fechado.");
    boundaryGeometry = parsed as import("@/types/supabase").Json;
  }

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

  const { data: farm, error } = await supabase.from("farms").insert({
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
  }).select("id").single();
  if (error || !farm) redirect("/farms?error=Não%20foi%20possível%20guardar%20a%20fazenda.%20Verifique%20as%20suas%20permissões.");

  if (boundaryGeometry) {
    const { error: boundarySaveError } = await supabase.rpc("save_farm_boundary", {
      p_farm_id: farm.id,
      p_geojson: boundaryGeometry,
    });
    if (boundarySaveError) {
      const message = encodeURIComponent("A fazenda foi criada, mas a delimitação não foi guardada. Pode corrigir os limites no editor do mapa.");
      redirect(`/farms/${farm.id}/boundary?error=${message}`);
    }
  }
  revalidatePath("/farms");
  revalidatePath("/dashboard");
  redirect(boundaryGeometry ? "/farms?saved=1&mapped=1" : "/farms?saved=1&needsBoundary=1");
}


export async function updateFarm(formData: FormData) {
  const id = value(formData,"farm_id");
  if (!id) redirect("/farms?error=Identificador%20da%20exploração%20em%20falta.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
  if (!Number.isFinite(latitude) || latitude! < -90 || latitude! > 90 ||
      !Number.isFinite(longitude) || longitude! < -180 || longitude! > 180) redirect("/farms?error=Indique%20coordenadas%20válidas.");
  if (area !== null && (!Number.isFinite(area) || area <= 0)) redirect("/farms?error=A%20área%20deve%20ser%20positiva.");
  if (soilPh !== null && (!Number.isFinite(soilPh) || soilPh < 0 || soilPh > 14)) redirect("/farms?error=O%20pH%20deve%20estar%20entre%200%20e%2014.");
  if (organicMatter !== null && (!Number.isFinite(organicMatter) || organicMatter < 0 || organicMatter > 100)) redirect("/farms?error=A%20matéria%20orgânica%20deve%20estar%20entre%200%20e%20100%25.");
  if (soilTexture && !soilTextures.includes(soilTexture)) redirect("/farms?error=Textura%20de%20solo%20inválida.");
  if (drainage && !drainageClasses.includes(drainage)) redirect("/farms?error=Classe%20de%20drenagem%20inválida.");
  if (soilObservedAt && !/^\d{4}-\d{2}-\d{2}$/.test(soilObservedAt)) redirect("/farms?error=Data%20de%20observação%20inválida.");

  const { error } = await supabase.from("farms").update({
    name, location_label: location || null, latitude, longitude,
    area_hectares: area, soil_texture: soilTexture || null, soil_ph: soilPh,
    organic_matter_pct: organicMatter, drainage_class: drainage || null,
    current_crop: currentCrop || null, soil_data_source: soilSource || null,
    soil_observed_at: soilObservedAt || null, notes: notes || null,
  }).eq("id",id);
  if (error) redirect("/farms?error=Não%20foi%20possível%20atualizar.%20Verifique%20as%20permissões.");
  revalidatePath("/farms");
  revalidatePath("/insights");
  revalidatePath("/dashboard");
  redirect("/farms?updated=1");
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


export async function saveFarmBoundary(formData: FormData) {
  const farmId = value(formData, "farm_id");
  const rawGeojson = value(formData, "boundary_geojson");
  if (!farmId || !rawGeojson || rawGeojson.length > 200000) {
    redirect("/farms?error=Delimitação%20inválida.");
  }

  let geometry: unknown;
  try { geometry = JSON.parse(rawGeojson); } catch {
    redirect("/farms?error=Os%20limites%20não%20estão%20num%20formato%20válido.");
  }

  if (!geometry || typeof geometry !== "object" ||
      (geometry as { type?: string }).type !== "Polygon" ||
      !Array.isArray((geometry as { coordinates?: unknown }).coordinates)) {
    redirect("/farms?error=Desenhe%20um%20polígono%20fechado%20antes%20de%20guardar.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("save_farm_boundary", {
    p_farm_id: farmId,
    p_geojson: geometry as import("@/types/supabase").Json,
  });
  if (error) {
    const message = encodeURIComponent(error.message.includes("polígono")
      ? error.message
      : "Não foi possível guardar os limites. Confirme as permissões e tente novamente.");
    redirect(`/farms/${farmId}/boundary?error=${message}`);
  }

  revalidatePath("/farms");
  revalidatePath(`/farms/${farmId}/boundary`);
  revalidatePath("/insights");
  redirect(`/farms/${farmId}/boundary?saved=1`);
}
