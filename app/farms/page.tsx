"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Farm = {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  areaHa: number | null;
  soilTexture: string;
  soilPh: number | null;
  organicMatter: number | null;
  drainage: string;
  currentCrop: string;
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = "spacexplore-tchiowa-farms-v1";

const emptyForm = {
  name: "",
  location: "Cabinda, Angola",
  latitude: "-5.55",
  longitude: "12.19",
  areaHa: "",
  soilTexture: "",
  soilPh: "",
  organicMatter: "",
  drainage: "",
  currentCrop: "",
  notes: ""
};

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFarms(JSON.parse(stored) as Farm[]);
    } catch {
      setMessage("Saved farm data could not be read from this browser.");
    } finally {
      setReady(true);
    }
  }, []);

  function persist(next: Farm[]) {
    setFarms(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMessage("Farm profile saved in this browser.");
    } catch {
      setMessage("Could not save this farm. Check browser storage availability.");
    }
  }

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const areaHa = form.areaHa.trim() ? Number(form.areaHa) : null;
    const soilPh = form.soilPh.trim() ? Number(form.soilPh) : null;
    const organicMatter = form.organicMatter.trim() ? Number(form.organicMatter) : null;

    if (!form.name.trim() || !form.location.trim()) {
      setMessage("Enter a farm name and location.");
      return;
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setMessage("Enter valid coordinates: latitude −90 to 90 and longitude −180 to 180.");
      return;
    }
    if (areaHa !== null && (!Number.isFinite(areaHa) || areaHa <= 0)) {
      setMessage("Farm area must be a positive number of hectares.");
      return;
    }
    if (soilPh !== null && (!Number.isFinite(soilPh) || soilPh < 0 || soilPh > 14)) {
      setMessage("Soil pH must be between 0 and 14.");
      return;
    }
    if (organicMatter !== null && (!Number.isFinite(organicMatter) || organicMatter < 0 || organicMatter > 100)) {
      setMessage("Organic matter must be between 0 and 100 percent.");
      return;
    }

    const farm: Farm = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      location: form.location.trim(),
      latitude,
      longitude,
      areaHa,
      soilTexture: form.soilTexture || "Not provided",
      soilPh,
      organicMatter,
      drainage: form.drainage || "Not provided",
      currentCrop: form.currentCrop.trim() || "Not provided",
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };
    persist([farm, ...farms]);
    setForm(emptyForm);
  }

  function removeFarm(id: string) {
    persist(farms.filter((farm) => farm.id !== id));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <Link className="back-link" href="/">← CLIMATE EXPLORER</Link>
      </header>

      <section className="farm-hero">
        <span className="eyebrow">02 / FARM INTELLIGENCE</span>
        <h1>Know your<br /><em>ground.</em></h1>
        <p className="hero-copy">Create a farm profile to connect its location, farmer-provided soil information and crop context with environmental data.</p>
      </section>

      <section className="workspace farm-workspace">
        <div className="section-heading">
          <div><span className="eyebrow">FARM MANAGEMENT</span><h2>Register a property</h2></div>
          <span className="status-tag">LOCAL MVP STORAGE</span>
        </div>
        <p className="section-copy">Fields marked optional can remain unknown. Soil information must come from the farmer, a field observation or a laboratory result—not from coordinates alone.</p>

        <form className="farm-form" onSubmit={submit}>
          <div className="form-section-title">PROPERTY DETAILS</div>
          <div className="form-grid">
            <label>FARM NAME *<input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Fazenda Maiombe" /></label>
            <label>LOCATION / LOCALITY *<input required value={form.location} onChange={(e) => update("location", e.target.value)} /></label>
            <label>LATITUDE *<input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} /></label>
            <label>LONGITUDE *<input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} /></label>
            <label>AREA (HECTARES)<input type="number" min="0.01" step="any" value={form.areaHa} onChange={(e) => update("areaHa", e.target.value)} placeholder="Optional" /></label>
            <label>CURRENT / MAIN CROP<input value={form.currentCrop} onChange={(e) => update("currentCrop", e.target.value)} placeholder="e.g. cassava, maize" /></label>
          </div>

          <div className="form-section-title">SOIL PROFILE <span>FARMER- OR LAB-REPORTED</span></div>
          <div className="form-grid">
            <label>SOIL TEXTURE<select value={form.soilTexture} onChange={(e) => update("soilTexture", e.target.value)}><option value="">Not provided</option><option>Sandy</option><option>Loamy sand</option><option>Loam</option><option>Silty</option><option>Clay loam</option><option>Clay</option><option>Unknown / not tested</option></select></label>
            <label>SOIL pH (0–14)<input type="number" min="0" max="14" step="0.1" value={form.soilPh} onChange={(e) => update("soilPh", e.target.value)} placeholder="Optional" /></label>
            <label>ORGANIC MATTER (%)<input type="number" min="0" max="100" step="0.1" value={form.organicMatter} onChange={(e) => update("organicMatter", e.target.value)} placeholder="Optional" /></label>
            <label>DRAINAGE<select value={form.drainage} onChange={(e) => update("drainage", e.target.value)}><option value="">Not provided</option><option>Well drained</option><option>Moderately drained</option><option>Poorly drained</option><option>Unknown / not assessed</option></select></label>
          </div>

          <label className="full-label">NOTES / SOURCE OF SOIL INFORMATION<textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="For example: farmer observation, laboratory report date, or other context." /></label>
          <button className="primary-button" type="submit" disabled={!ready}>SAVE FARM PROFILE ↗</button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>
      </section>

      <section className="farm-list-section">
        <div className="section-heading"><div><span className="eyebrow">YOUR PROPERTIES</span><h2>Registered farms</h2></div><span className="status-tag">{farms.length} SAVED</span></div>
        {!ready ? <p className="section-copy">Loading saved profiles…</p> : farms.length === 0 ? (
          <div className="empty-state"><strong>No farms registered yet.</strong><p>Create the first profile using the form above. It will be stored in this browser for this prototype.</p></div>
        ) : (
          <div className="farm-cards">{farms.map((farm) => (
            <article className="farm-card" key={farm.id}>
              <div className="farm-card-top"><span className="eyebrow">FARM PROFILE</span><button className="delete-button" onClick={() => removeFarm(farm.id)} type="button" aria-label={`Delete ${farm.name}`}>REMOVE</button></div>
              <h3>{farm.name}</h3><p className="farm-location">{farm.location}</p>
              <div className="farm-facts"><span>LAT / LON<strong>{farm.latitude}, {farm.longitude}</strong></span><span>AREA<strong>{farm.areaHa === null ? "Not provided" : `${farm.areaHa} ha`}</strong></span><span>MAIN CROP<strong>{farm.currentCrop}</strong></span><span>SOIL TEXTURE<strong>{farm.soilTexture}</strong></span><span>SOIL pH<strong>{farm.soilPh === null ? "Not measured" : farm.soilPh}</strong></span><span>DRAINAGE<strong>{farm.drainage}</strong></span></div>
              <Link className="farm-climate-link" href={`/?latitude=${farm.latitude}&longitude=${farm.longitude}&farm=${encodeURIComponent(farm.name)}`}>EXPLORE THIS FARM’S CLIMATE ↗</Link><p className="farm-disclaimer">Profile saved locally on this device. It is not yet synchronized to a cloud database.</p>
            </article>
          ))}</div>
        )}
      </section>

      <footer><span>SPACEXPLORE TCHIOWA</span><span>FARM PROFILES · SCIENTIFICALLY TRANSPARENT</span></footer>
    </main>
  );
}
