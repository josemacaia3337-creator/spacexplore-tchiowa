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
- **GPM:** satellite precipitation products. Select an appropriate product and document its resolution and limitations.
- **ECOSTRESS:** evapotranspiration and thermal information. Check product availability, coverage, and processing requirements.
- **Harmonized Landsat and Sentinel-2 (HLS):** vegetation and land-surface observations. Requires geospatial processing and careful interpretation.

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
