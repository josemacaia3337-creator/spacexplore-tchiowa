# Technical architecture — initial plan

## 1. Architecture principles

- Build the smallest end-to-end vertical slice first.
- Keep external data access behind a provider/service boundary.
- Keep scientific calculations separate from UI components.
- Make units, date ranges, source identifiers, and retrieval timestamps explicit.
- Never silently substitute missing data or silently reinterpret units.
- Store secrets only in environment variables; public browser configuration must contain no private keys.

## 2. Proposed MVP structure

Initial web application:
- **Presentation:** Next.js + TypeScript, responsive dashboard and farm/scenario screens.
- **Domain layer:** typed models for farms, soil observations, crop profiles, climate observations, and rotation scenarios.
- **Data provider:** NASA POWER client isolated in a server-side module or API route.
- **Analysis layer:** deterministic climate summaries and transparent crop-rotation rules.
- **Persistence:** begin with local/sample data; add PostgreSQL/Supabase only when the core flow is proven.

A separate Python/FastAPI service is not required for the first vertical slice. Add it only if geospatial/scientific processing becomes substantial enough to justify another deployable service.

## 3. Initial data flow

1. User selects a farm location and date range.
2. Server validates coordinates and dates.
3. NASA POWER client requests supported daily parameters.
4. Response is parsed and normalized without losing original parameter names or units.
5. UI displays observations, missing-value handling, source, and coverage.
6. Analysis layer derives simple summaries.
7. Rotation engine evaluates crop sequences using explicit input attributes and rules.
8. UI shows comparison, reasoning, and uncertainty.

## 4. Suggested domain types

- Farm: id, name, latitude, longitude, area (optional), location label.
- SoilProfile: farmId, texture, pH, organic matter, drainage, source, measuredAt; each property may be unknown.
- CropProfile: id, name, family, season length, water demand category, nutrient/family notes, source.
- ClimateSeries: source, parameters, units, coordinates, startDate, endDate, retrievedAt, observations.
- RotationScenario: ordered crop sequence, assumptions, rule results, score breakdown, limitations.

## 5. NASA POWER integration contract

The client should accept:
- latitude and longitude;
- start and end dates;
- an allow-listed set of parameters.

It should return:
- source identifier and request metadata;
- parameter names and units;
- dated observations;
- explicit missing-value representation;
- a normalized error when the upstream service fails.

Do not assume all parameters are available for every temporal resolution or date range. Validate the real API response before finalizing the UI contract.

## 6. Rotation engine

Start with deterministic, explainable rules. Each rule must identify:
- the input it needs;
- the evidence/source behind it;
- the condition evaluated;
- its effect on the scenario result;
- whether missing data prevents evaluation.

Do not call a heuristic score a scientific prediction. Display a breakdown, not just a single opaque score.

## 7. Quality and safety

- Validate coordinate ranges and date order.
- Handle network failures, rate limits, empty data, and malformed responses.
- Add tests for unit conversion, missing values, date handling, and rotation rules.
- Avoid exposing API secrets in client bundles or logs.
- Label sample farm data and illustrative crop assumptions.
- Include dataset attribution in the interface and project submission.

## 8. Implementation sequence

1. Scaffold the web application and establish visual foundations.
2. Implement a server-side NASA POWER request and validate a real response.
3. Build climate summary and chart states.
4. Add farm and soil profile inputs.
5. Add crop profiles and transparent rotation comparison.
6. Test mobile usability and prepare a reproducible demo.
