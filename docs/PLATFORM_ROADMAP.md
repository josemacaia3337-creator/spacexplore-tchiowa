# Platform roadmap — SpaceXplore Tchiowa

## Product objective

Build an Angola-first, internationally extensible agricultural intelligence platform that connects farm and parcel records, environmental observations, crop evidence, and field operations. The product provides explainable decision support and does not replace agronomists, laboratories, or agricultural extension services.

## Current baseline

The repository currently contains:
- Climate Explorer backed by a server-side NASA POWER route.
- Farm profiles stored in browser localStorage.
- A starter crop catalogue.
- An illustrative three-crop rotation explorer.
- An initial agricultural insights page.

The current farm storage is device/browser-local and is not multi-user cloud persistence. The current rotation engine is illustrative, not a validated farm-specific recommendation. Runtime verification of all provider values and units remains a separate requirement.

## Workstreams and acceptance criteria

### A. Brand and application experience
- Establish a consistent brand token system, typography, spacing, iconography, and component patterns.
- Build responsive navigation with a real mobile menu.
- Separate public product introduction from authenticated workspace.
- Provide accessible forms, focus states, loading skeletons, errors, empty states, and confirmations.
- Acceptance: core journeys work on narrow mobile screens and desktop without clipped navigation or horizontal overflow.

### B. Identity and organization workspaces
- Add sign-up, sign-in, sign-out, password recovery, and protected routes.
- Add user profiles and organization workspaces.
- Support multiple organization memberships and centrally defined roles.
- Acceptance: a user can access only organizations and records for which they have an active membership; authorization is tested at the database and server boundaries.

### C. Farm and parcel management
- Replace localStorage as the source of truth with PostgreSQL.
- Support multiple farms and parcels per organization.
- Add coordinate validation and later map-based polygon drawing/area calculation.
- Preserve source and measurement dates for soil observations.
- Acceptance: farm data persists across devices and is isolated between organizations by RLS.

### D. Scientific data foundation
- Maintain provider adapters and normalized dataset metadata.
- Record dataset, parameters, units, location/grid, period, retrieval time, coverage, and fill-value handling.
- Cache provider responses and handle outages, rate limits, and malformed responses.
- Acceptance: a displayed metric can be traced to a source, method, unit, and period; missing data is never silently converted into a valid observation.

### E. Crop and rotation intelligence
- Expand crop profiles only with credible, cited evidence and geographic applicability.
- Version rule sets and expose each rule's inputs, source, conditions, and limitations.
- Distinguish illustrative patterns from evaluated recommendations.
- Acceptance: users can inspect why each rule fired and which missing inputs prevent a conclusion.

### F. Field operations
- Record planting, irrigation, fertilization, crop protection, harvest, and field observations.
- Attach dated notes and images with scoped access.
- Acceptance: a farm's operational history is chronological, attributable, and exportable.

### G. Administration and operations
- Provide authorized management of users, organizations, crop catalogue, sources, and platform settings.
- Add audit events, monitoring, backups, and recovery procedures.
- Acceptance: sensitive administrative actions are permission-checked and auditable.

## Delivery order

1. Application shell and mobile experience.
2. Dedicated database project selection and secure environment setup.
3. Authentication, profiles, organizations, memberships, and RLS.
4. Cloud-backed farm persistence and migration of existing local records where feasible.
5. Parcel mapping and soil observation records.
6. Scientific data normalization, caching, and verification.
7. Crop evidence and explainable rotation methods.
8. Field operations, administration, and operational hardening.

## Non-goals until evidence and infrastructure are ready

- Yield, revenue, or profitability guarantees.
- Automatic soil diagnosis from coordinates.
- Unvalidated crop suitability scores.
- Forecast claims derived from historical daily averages.
- Public access to private farm records or documents.
- A microservices split without a demonstrated operational need.

## Release gates

A release must pass type checking, lint, production build, core automated tests, RLS/security review, and a deployed smoke test for any external integration it changes. A successful deployment alone does not prove scientific correctness or authorization correctness.
