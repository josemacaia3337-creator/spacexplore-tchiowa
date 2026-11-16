# SpaceXplore Tchiowa — product architecture

## Current product direction

SpaceXplore Tchiowa is an agricultural and environmental intelligence platform. The public entry point gives the Climate Consultant the highest prominence. The platform combines documented environmental datasets with user-provided farm information and field records. It is decision support, not a substitute for direct field measurement, agronomic validation, or professional advice.

## Public homepage

The homepage is organized in this order:

1. **Compact header:** logo and product name on the left; icon-only three-line navigation on the right. The menu opens the public navigation panel.
2. **Hero:** a locally hosted Earth-observation illustration, a concise platform statement, and two links: open the Climate Consultant and explore the platform.
3. **Climate Consultant preview:** the existing live NASA POWER query remains functional and is moved directly below the hero to make it the primary product experience.
4. **Platform overview:** concise explanation of the product's purpose.
5. **Capabilities:** environmental intelligence, farm management, monitoring, and evidence-based analysis.
6. **Science and provenance:** sources, units, periods, processing and limitations.
7. **Account access:** sign-up and sign-in.
8. **Footer:** platform navigation, workspace access and JPM Tech Solutions attribution.

Visitors may view the public presentation and use the public climate query without creating an account. Private workspace features require authentication and organization permissions.

## Climate Consultant — experience

The map is intended to become the main geographic entry point. The first functional iteration continues to support coordinate-based selection and NASA POWER Daily data. A map provider must be selected only after checking licensing, attribution, tile/service limits, mobile performance and geocoding coverage in Angola. Do not hard-code a commercial map key or introduce a provider lock-in.

The target workflow is:

1. Search for a country, province, municipality, locality or coordinates.
2. Select a point on the map.
3. Choose a date range and supported variables.
4. Retrieve data through server-side provider adapters.
5. Validate and normalize values and missing-data codes.
6. Calculate indicators using variable-appropriate aggregation.
7. Present charts, detailed data, coverage, source and scientific limitations.
8. Optionally save the query for authenticated users.

The current NASA POWER integration is a historical daily-data service, not a real-time weather forecast. UI labels must not imply forecast or instantaneous weather where the source does not provide it.

## Analysis and provenance contract

Every result should preserve:
- provider and dataset name;
- parameter identifiers and units;
- selected coordinates or spatial footprint;
- requested and actually covered periods;
- retrieval timestamp and time standard;
- missing/fill-value treatment and valid sample count;
- aggregation method and software/method version;
- source resolution and known limitations, where supplied.

Temperature means/maxima/minima, precipitation totals/means, and relative humidity must use distinct, explicitly documented aggregation rules. Never infer drought, crop suitability, disease, soil pH, soil texture or yield from climate values alone.

## Application areas

### Public
- Homepage and product information.
- Climate Consultant.
- Source and methodology information.
- Authentication entry points.

### Authenticated workspace
- Overview and organization selection.
- Farms and farm history.
- Crops and agricultural records.
- Monitoring and evidence-based insights.
- Saved climate queries (planned).
- Personal and organization settings.

### Administration
- User and organization administration.
- Role and membership management.
- Data-source configuration and integration health.
- Audit trail and security events.
- Platform settings and operational monitoring.

Administrative capabilities must be separately authorized on the server and enforced by database policies where applicable. Hiding a control in the UI is not an authorization boundary.

## Technical boundaries

- **Experience:** Next.js App Router, responsive components, accessible interactions.
- **Application:** server actions and route handlers for authenticated use cases.
- **Domain:** validation, permissions, climate calculations and versioned analytical rules.
- **Infrastructure:** Supabase repositories, cache, storage, logging and monitoring.
- **Provider adapters:** NASA POWER initially; additional sources only after scientific and operational evaluation.

Provider parsing and scientific calculations must not live inside visual components. External requests remain server-side, allow-listed, bounded by timeouts and protected against abusive request volume.

## Delivery sequence

1. Public homepage hierarchy and stable visual identity.
2. Climate Consultant layout and geographic selection.
3. Climate data validation, aggregation, charts and provenance.
4. Workspace experience and organization management.
5. Administration and audit capabilities.
6. Additional APIs and datasets after coverage, resolution, terms, costs and quality are verified.
7. Automated tests, security review, performance and mobile QA.

## Current implementation note

The public homepage has been updated to feature the Climate Consultant immediately after the hero, use a locally hosted SVG hero asset instead of remote rotating stock-photo URLs, and use the agreed icon-only three-line menu. The existing NASA POWER query route and response flow are retained. Map selection, dedicated charts, and a full analysis engine remain subsequent implementation work and must not be represented as already complete.
