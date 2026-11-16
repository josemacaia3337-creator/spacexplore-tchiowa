# Data sources and provenance

This document tracks candidate datasets. A dataset is not considered integrated until its endpoint, parameters, units, temporal coverage, and response behavior have been tested.

## NASA POWER — initial integration

- Provider: NASA Prediction Of Worldwide Energy Resources (POWER)
- API documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- Intended use: daily meteorological and solar indicators for a farm location.
- Candidate parameters:
  - `T2M`: temperature at 2 metres (°C)
  - `T2M_MAX`: maximum temperature at 2 metres (°C)
  - `T2M_MIN`: minimum temperature at 2 metres (°C)
  - `PRECTOTCORR`: corrected precipitation (mm/day)
  - `RH2M`: relative humidity at 2 metres (%)
- Validation required: confirm parameter support, units, missing-value codes, date constraints, and exact response structure against live API responses.

## Other candidate NASA datasets

These are candidates only; do not present them as integrated until implemented and validated.

- **SMAP:** soil-moisture observations/products. Product selection, spatial resolution, temporal coverage, and access method must be evaluated.
- **GPM / IMERG:** NASA PMM Publisher `precip_1d` (IMERG Late Run, 1-day accumulation). The API documents a rolling 60-day availability window and regional preview products. The current app integration displays the official NASA regional preview and metadata; it does not yet sample the underlying GeoTIFF pixel at the exact coordinate. Treat the preview as regional context, not a point measurement.
- **ECOSTRESS:** evapotranspiration and thermal information. Check product availability, coverage, and processing requirements.
- **Harmonized Landsat and Sentinel-2 (HLS):** vegetation and land-surface observations. Requires geospatial processing and careful interpretation.

## NASA GPM / IMERG — Phase 2 integration

- Provider: NASA Global Precipitation Measurement (GPM) mission / Precipitation Processing System (PPS).
- API: https://pmmpublisher.pps.eosdis.nasa.gov/opensearch
- NASA API documentation: https://gpm.nasa.gov/precip-apps/doc
- Product: `precip_1d` — IMERG Late Run 1-day precipitation accumulation.
- Unit: millimetres (mm) accumulated over one day.
- Spatial grid: 0.1° (approximately 10 km); PMM Publisher returns regional preview products for the region containing the requested latitude/longitude.
- Temporal availability: rolling 60-day window in PMM Publisher.
- Important limitation: current UI presents a regional PNG preview and source metadata. It does not yet extract the numerical raster cell at the exact coordinate. Do not label the regional preview as a point-level value or infer rainfall amount from image colour.
- Late Run is not instantaneous; the newest daily observation may not yet be available. Empty dates must be reported as unavailable, never replaced with sample data.

## Provenance requirements

For every dataset used in the app, record:
- dataset/provider and product name;
- endpoint or product identifier;
- parameter/band and unit;
- spatial and temporal resolution where available;
- selected coordinates/area and date range;
- retrieval date/time;
- processing or aggregation applied;
- known limitations and missing-data handling.

## Interpretation cautions

- Weather reanalysis/derived products are not direct measurements at the farm boundary.
- Gridded satellite products have spatial resolution limitations.
- Soil moisture is not the same as soil texture, pH, or nutrient content.
- Vegetation indices are not direct yield measurements.
- Historical climate data must not be presented as a future forecast.
