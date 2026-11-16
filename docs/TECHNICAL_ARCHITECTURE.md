# Technical architecture — platform foundation

## 1. Product direction

SpaceXplore Tchiowa is a modular agricultural intelligence platform. It combines farmer- and organization-provided farm records with documented Earth-observation and environmental datasets to support transparent analysis. The initial demonstration is Cabinda, Angola; the system must remain geographically configurable.

The platform is decision support, not an autonomous agronomist. It must distinguish:
- observed or provider-reported data;
- user-entered field records;
- derived statistics;
- modelled or inferred outputs;
- missing or unverified evidence.

Every derived result must retain its method, inputs, source references, units, period, and limitations.

## 2. Architecture principles

1. Build vertical slices that can be tested end to end.
2. Keep presentation, domain logic, data access, and external providers separate.
3. Treat organizations and memberships as the ownership boundary for shared workspaces.
4. Enforce authorization on the server and in PostgreSQL Row Level Security (RLS); hiding UI controls is not security.
5. Keep secrets server-side. Only publishable Supabase configuration may reach the browser.
6. Make provider integrations replaceable and cache external data responsibly.
7. Store provenance, units, timestamps, spatial resolution, and quality/coverage metadata.
8. Never fabricate missing soil, crop, climate, or operational evidence.
9. Keep important business rules and platform settings configurable and auditable.
10. Design for mobile use, accessibility, internationalization, and low-bandwidth conditions.

## 3. Target system boundaries

### Web application
- Next.js App Router and TypeScript.
- Responsive application shell with public, authenticated, and administrative areas.
- Server components/actions or route handlers for trusted operations.
- Client components only where interaction requires them.

### Identity and persistence
- Supabase Auth for identity and sessions.
- PostgreSQL for domain records.
- Supabase Storage for user-uploaded reports and field images, with private buckets and scoped access policies.
- RLS on every exposed table.
- Generated TypeScript database types after schema stabilization.

A dedicated SpaceXplore Supabase project must be selected or created before connecting the application. Do not reuse an unrelated project. No database project is provisioned by this architecture document.

### Domain services
- Farm and parcel management.
- Crop catalogue and crop evidence.
- Field operations and observations.
- Climate and Earth-observation data access.
- Scientific analysis and explainable rules.
- Administration and audit.

### External providers
- NASA POWER initially.
- Additional satellite, climate, soil, and local data providers only after verifying access, terms, resolution, units, and scientific suitability.

## 4. Logical application layers

1. **Experience layer:** pages, layouts, navigation, forms, maps, charts, and accessible states.
2. **Application layer:** authenticated use cases such as create farm, add parcel, request climate series, or record field operation.
3. **Domain layer:** typed entities, validation, permissions, scientific rules, and calculations.
4. **Infrastructure layer:** Supabase repositories, storage, caching, logging, and provider clients.
5. **External data layer:** NASA and other documented providers.

UI components must not contain provider-specific parsing or scientific calculations.

## 5. Core domain model

Initial logical entities (not yet a database migration):

- **profiles:** user-facing profile linked to the authenticated identity.
- **organizations:** individual workspace, farm business, cooperative, research group, or institution.
- **memberships:** user, organization, role, status, and invitation metadata.
- **farms:** organization-owned property with name, locality, coordinates, and optional area.
- **parcels:** farm sub-areas with optional polygon geometry, area, and identifier.
- **soil_observations:** individual measurements/observations with property, value, unit, method, source, measured date, and evidence attachment. Unknown is not zero.
- **crop_species:** curated crop catalogue and taxonomy.
- **crop_evidence:** sourced crop attributes, geographic applicability, publication/version, and validation status.
- **plantings:** crop, parcel, season, planting/harvest dates, cultivar, and status.
- **field_operations:** dated operation records such as irrigation, fertilization, planting, and harvest.
- **field_observations:** field notes, pest/disease observations, photos, and location/time metadata.
- **data_sources:** provider, dataset, version, terms, attribution, and documentation URL.
- **climate_cache:** normalized provider response summaries keyed by dataset, parameters, coordinates/grid cell, and period, with retrieval and expiry metadata.
- **analysis_runs:** analysis method/version, subject, input snapshot, source references, result, uncertainty, and execution timestamp.
- **audit_events:** security-relevant changes and administrative actions.

Use stable UUID identifiers. Use UTC timestamps for events and explicit local dates for agricultural seasons. Spatial geometry should use a suitable PostGIS type only after enabling and validating the extension in the dedicated project.

## 6. Ownership and access model

- A user can belong to multiple organizations.
- An organization can own multiple farms.
- A farm can contain multiple parcels.
- Farm and parcel records are accessible only to active organization members with the appropriate role.
- Roles begin with owner, administrator, manager, agronomist, field_operator, and viewer.
- Role permissions must be defined centrally and enforced by server-side checks plus RLS.
- Public crop catalogue content is read-only for normal users; editorial changes are restricted to authorized administrators.
- Private files must be accessed through authenticated, scoped storage policies or short-lived signed URLs.
- Never use user-editable profile metadata as an authorization source.

## 7. Data and analysis flow

1. User selects an authorized farm or parcel.
2. Application validates the requested operation and access rights.
3. Provider adapter requests only allow-listed datasets and parameters.
4. Response is validated, normalized, and tagged with source metadata.
5. Cache stores reusable provider results with an explicit key and expiry.
6. Domain analysis consumes normalized data and a versioned method.
7. Analysis run stores its input snapshot, evidence references, outputs, coverage, uncertainty, and limitations.
8. UI presents results with provenance and clear distinction between observations and inference.

## 8. NASA POWER contract

Keep the existing server-side API route as an adapter during the transition. Its contract should validate coordinates, date ranges, and parameter allow-lists; normalize upstream failures; preserve original parameter identifiers and units; and return source, retrieval time, requested period, coordinates, fill-value handling, and valid-data coverage.

Do not assume that one grid point represents an entire farm. Display the grid/source resolution and explain the spatial limitation when available. Verify the live response shape and units before using a parameter in further analysis.

## 9. Security baseline

- Supabase Auth sessions handled using the currently supported Next.js SSR integration.
- No service-role or secret key in browser bundles or NEXT_PUBLIC variables.
- RLS enabled for every exposed table, with policies based on organization membership and role.
- Ownership predicates required; authenticated status alone is insufficient.
- UPDATE policies include both USING and WITH CHECK.
- Storage buckets private by default; object paths and policies scoped to organization/farm.
- Validate all inputs at API boundaries; apply rate limits to expensive external requests.
- Avoid logging credentials, tokens, sensitive farm documents, or unnecessary personal data.
- Keep dependency versions pinned and commit the package-manager lockfile.
- Add audit events for membership, role, and sensitive record changes.
- Review Supabase security and performance advisors after schema changes.

## 10. Reliability and performance

- Cache external scientific data with dataset-aware keys and documented expiry.
- Use request timeouts, bounded retries, and clear upstream error states.
- Avoid duplicate provider requests from repeated page renders.
- Paginate large lists and load map layers on demand.
- Use background processing only when data volume or runtime justifies it.
- Add structured error reporting, health checks, backups, and restore procedures before production use.
- Design for low bandwidth and graceful degradation when external providers are unavailable.

## 11. Implementation sequence

### Foundation (current phase)
1. Establish responsive public/authenticated application shell and brand system.
2. Select a dedicated Supabase project and region.
3. Add Supabase SSR client setup and environment template.
4. Define and migrate profiles, organizations, memberships, and farms with RLS.
5. Replace localStorage farm persistence with authenticated database operations.
6. Add automated type, lint, build, and authorization checks.

### Geospatial and agricultural workflows
7. Add parcels and map selection/drawing.
8. Add soil observations with source and measurement metadata.
9. Expand crop evidence and planting/season records.
10. Add field operations and observations.

### Intelligence and scale
11. Normalize and cache external datasets.
12. Version analysis methods and persist reproducible analysis runs.
13. Add further Earth-observation datasets after scientific validation.
14. Add administrative tools, audit views, monitoring, and operational controls.

## 12. Definition of done

A feature is not complete merely because a page renders. It must include:
- input and authorization validation;
- loading, empty, success, and failure states;
- mobile and keyboard accessibility;
- tests for important business rules;
- source and limitation disclosure where scientific data is involved;
- migration and RLS policies for persisted data;
- verification in a deployed environment when external integrations are involved.
