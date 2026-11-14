export type ClimateParameterSeries = Record<string, number>;

export type ClimateAnalysisInput = {
  parameters: Record<string, ClimateParameterSeries>;
  fillValue?: number;
  start: string;
  end: string;
};

export type ClimateMetric = {
  key: string;
  label: string;
  unit: string;
  validDays: number;
  expectedDays: number;
  coveragePercent: number;
  mean: number | null;
  total: number | null;
  aggregation: string;
};

function expectedDayCount(start: string, end: string): number {
  const parse = (value: string) => new Date(Date.UTC(
    Number(value.slice(0, 4)),
    Number(value.slice(4, 6)) - 1,
    Number(value.slice(6, 8))
  ));
  const first = parse(start);
  const last = parse(end);
  return Math.floor((last.getTime() - first.getTime()) / 86400000) + 1;
}

export function analyzeClimate(input: ClimateAnalysisInput): ClimateMetric[] {
  const expectedDays = expectedDayCount(input.start, input.end);
  const definitions = [
    { key: "T2M", label: "Mean air temperature", unit: "°C", aggregation: "Mean of valid daily means" },
    { key: "T2M_MAX", label: "Daily maximum temperature", unit: "°C", aggregation: "Mean of valid daily maximum values" },
    { key: "T2M_MIN", label: "Daily minimum temperature", unit: "°C", aggregation: "Mean of valid daily minimum values" },
    { key: "PRECTOTCORR", label: "Corrected precipitation", unit: "mm", aggregation: "Sum of valid daily precipitation values" },
    { key: "RH2M", label: "Relative humidity", unit: "%", aggregation: "Mean of valid daily values" }
  ];

  return definitions.map((definition) => {
    const series = input.parameters[definition.key] ?? {};
    const values = Object.values(series).filter((value) =>
      Number.isFinite(value) && value > -900 && value !== (input.fillValue ?? -999)
    );
    const sum = values.reduce((total, value) => total + value, 0);
    return {
      ...definition,
      validDays: values.length,
      expectedDays,
      coveragePercent: expectedDays > 0 ? Math.min(100, values.length / expectedDays * 100) : 0,
      mean: values.length ? sum / values.length : null,
      total: definition.key === "PRECTOTCORR" && values.length ? sum : null
    };
  });
}

export type FarmReadinessItem = {
  label: string;
  status: "provided" | "missing";
  detail: string;
};

export function assessFarmReadiness(farm: {
  areaHa?: number | null;
  soilTexture?: string | null;
  soilPh?: number | null;
  organicMatter?: number | null;
  drainage?: string | null;
  currentCrop?: string | null;
}): FarmReadinessItem[] {
  const provided = (value: unknown) => value !== null && value !== undefined &&
    value !== "" && value !== "Not provided" && value !== "Unknown / not tested" &&
    value !== "Unknown / not assessed";

  return [
    { label: "Farm area", value: farm.areaHa, detail: "Area supplied in the farm profile." },
    { label: "Soil texture", value: farm.soilTexture, detail: "Farmer-reported or field/lab assessed." },
    { label: "Soil pH", value: farm.soilPh, detail: "A measured value is needed; coordinates cannot provide it." },
    { label: "Soil organic matter", value: farm.organicMatter, detail: "A measured or documented value is needed." },
    { label: "Drainage", value: farm.drainage, detail: "Field observation or local assessment is needed." },
    { label: "Current / main crop", value: farm.currentCrop, detail: "Crop information supplied by the farmer." }
  ].map((item) => ({
    label: item.label,
    status: provided(item.value) ? "provided" : "missing",
    detail: item.detail
  }));
}
