const timeoutMs = 20000;

async function checkProvider(name, url, validate) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    validate(payload);
    console.log(JSON.stringify({
      event: "PROVIDER_SMOKE_TEST_PASSED",
      provider: name,
      status: response.status,
      checkedAt: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error(JSON.stringify({
      event: "PROVIDER_SMOKE_TEST_FAILED",
      provider: name,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error
        ? { name: error.name, message: error.message.slice(0, 500) }
        : { message: String(error).slice(0, 500) },
    }));
    return false;
  }
}

const powerUrl = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
powerUrl.search = new URLSearchParams({
  parameters: "T2M,PRECTOTCORR",
  community: "AG",
  longitude: "12.19",
  latitude: "-5.55",
  start: "20250101",
  end: "20250103",
  format: "JSON",
  "time-standard": "UTC",
}).toString();

const now = new Date();
now.setUTCHours(0, 0, 0, 0);
const endDate = new Date(now);
endDate.setUTCDate(endDate.getUTCDate() - 4);
const startDate = new Date(endDate);
startDate.setUTCDate(startDate.getUTCDate() - 2);
const iso = (date) => date.toISOString().slice(0, 10);

const gpmUrl = new URL("https://pmmpublisher.pps.eosdis.nasa.gov/opensearch");
gpmUrl.search = new URLSearchParams({
  q: "precip_1d",
  lat: "-5.55",
  lon: "12.19",
  limit: "10",
  startTime: iso(startDate),
  endTime: iso(endDate),
}).toString();

const results = await Promise.all([
  checkProvider("NASA_POWER_DAILY", powerUrl, (payload) => {
    const parameters = payload?.properties?.parameter;
    if (!parameters || typeof parameters !== "object" || !("T2M" in parameters)) {
      throw new Error("NASA POWER payload is missing the expected T2M parameter.");
    }
  }),
  checkProvider("NASA_GPM_PMM_PUBLISHER", gpmUrl, (payload) => {
    if (!Array.isArray(payload?.items)) {
      throw new Error("NASA GPM response does not contain an items array.");
    }
  }),
]);

if (results.some((passed) => !passed)) {
  console.error("One or more external data providers failed their smoke test. This is diagnostic only and does not block deployment.");
  process.exitCode = 1;
}
