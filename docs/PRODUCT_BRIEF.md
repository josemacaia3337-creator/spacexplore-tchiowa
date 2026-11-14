# Product brief — SpaceXplore Tchiowa

## 1. Problem

Farmers make crop-planning decisions under changing and variable environmental conditions. Relevant climate and Earth-observation information can be difficult to translate into practical comparisons of crop-rotation options.

## 2. Proposed solution

SpaceXplore Tchiowa is a web-based agricultural decision-support prototype. It combines:
- location-specific environmental data from documented sources;
- farm details entered by the farmer;
- crop profiles and transparent rotation rules;
- side-by-side scenario comparisons and plain-language explanations.

The product supports exploration and discussion. It does not claim to replace agronomists, laboratory soil analysis, or local agricultural extension services.

## 3. Initial demonstration

The first demo scenario is a sample farm in Cabinda, Angola. Its coordinates and all farm/soil/crop inputs will be explicitly labelled as sample data unless supplied or verified by a real farm operator.

A user should be able to:
1. Open the sample farm.
2. Review its location and declared soil/crop information.
3. Load available historical NASA POWER climate data.
4. Review charts and a concise climate summary.
5. compare two or more illustrative crop sequences.
6. inspect why a scenario receives its score, including assumptions and missing information.

## 4. MVP scope

### Must have
- Responsive web interface.
- One editable sample farm profile.
- Configurable latitude, longitude, and date range.
- NASA POWER daily data retrieval.
- Loading, empty, and API-error states.
- Climate charts with units and date range.
- A small crop catalogue with sourced/declared crop attributes.
- Transparent rule-based rotation comparison.
- Clear data provenance and limitations.

### Should have if time permits
- Map-based location selection.
- Multiple farm profiles.
- Exportable scenario summary.
- Additional NASA datasets after validating access and interpretation.

### Out of scope for the first prototype
- Yield, revenue, or profit guarantees.
- Automated diagnosis of soil nutrients or pH from coordinates alone.
- Long-range climate prediction built from historical daily data.
- Unverified AI-generated agronomic recommendations.
- Complex user roles, billing, or production-scale multi-tenancy.

## 5. Success criteria

- The demo retrieves real NASA POWER data for a chosen coordinate and date range.
- Every displayed indicator includes a name, unit, source, and date range.
- A user can compare at least two rotation scenarios.
- Scenario scores can be explained from visible rules and inputs.
- Missing or estimated information is clearly disclosed.
- The app remains usable on a mobile screen.

## 6. Guiding principles

Scientific honesty, explainability, accessibility, modularity, low-cost operation, and an Angola-first demonstration with international geographic support.
