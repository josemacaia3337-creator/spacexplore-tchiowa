# SpaceXplore Tchiowa

**Intelligent agricultural decision-support platform** combining NASA Earth observation and climate data with farm-specific information to help explore adaptive crop-rotation strategies.

> Built for the NASA Space Apps Challenge 2026 — Field Shift: Adapting Farms with NASA Data.

## Product vision

SpaceXplore Tchiowa turns environmental data into understandable evidence for agricultural planning. The first demonstration will use a farm scenario in **Cabinda, Angola**, while the product architecture remains location-independent.

## MVP priorities

1. Register a demonstration farm and its geographic location.
2. Capture farmer-provided soil properties and current/planned crops.
3. Retrieve and visualize historical climate indicators from NASA POWER.
4. Compare clearly labelled crop-rotation scenarios using transparent agronomic rules.
5. Explain assumptions, data limitations, risks, and trade-offs.

## Scientific integrity

- NASA datasets must be attributed and their parameters, units, temporal coverage, and retrieval dates recorded.
- Climate history is not a forecast. Historical averages must not be presented as future projections.
- Satellite-derived indicators are proxies and do not replace field soil tests.
- Missing soil measurements must remain explicitly unknown; they must not be fabricated.
- Rotation scores are decision-support heuristics, not guaranteed yield or profit predictions.
- Recommendations should disclose assumptions and uncertainty.

## Initial data source

**NASA POWER Daily API** — meteorological and solar data. Initial candidate parameters:
- `T2M`, `T2M_MAX`, `T2M_MIN` (°C)
- `PRECTOTCORR` (mm/day)
- `RH2M` (%)

We will verify parameter availability and API responses for the selected location before relying on them.

Official documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/

## Planned technology direction

- Web application: Next.js + TypeScript
- Geospatial and scientific processing: Python (as needed)
- Data persistence: PostgreSQL / Supabase (only when persistence is needed)
- Maps: provider selected after checking hackathon offer access and quotas
- Deployment: Vercel or another suitable free-tier host

Technology choices remain replaceable; no provider-specific dependency should be introduced without a clear MVP need.

## Repository map

- `docs/PRODUCT_BRIEF.md` — problem, users, scope, and demonstration story
- `docs/TECHNICAL_ARCHITECTURE.md` — system boundaries and implementation plan
- `docs/DATA_SOURCES.md` — datasets, parameters, attribution, and limitations

## Status

**Stage:** project foundation and data validation.

The next engineering milestone is a small, tested NASA POWER integration for a configurable point location, followed by a first climate dashboard.

## Team

SpaceXplore Tchiowa — Angola.
