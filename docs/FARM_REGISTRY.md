# Farm registry and geospatial mapping — Stage 1

## Purpose
Stage 1 lets an authenticated organization register an agricultural property, record its declared location and primary crop, draw its boundary on an interactive map, and store the resulting polygon and geodesic area.

## User flow
1. Open Explorações from the authenticated dashboard.
2. Select an organization and enter the farm name, locality, reference coordinates, declared area (optional), and current primary crop.
3. Use the map to draw the property boundary. The user marks at least three vertices; the client closes the GeoJSON polygon.
4. Submit the form. The farm record is inserted under the selected organization and the existing PostGIS RPC validates and stores the polygon.
5. The area is calculated on the server from WGS84 geometry using PostGIS geography, in hectares. The declared area remains separate from the mapped area.
6. If map saving fails after farm creation, the user is sent to the existing boundary editor to retry; the farm record is not silently discarded.

## Data and security
- Existing Supabase Auth and organization memberships are reused.
- Existing Row Level Security policies on farms remain the access-control boundary.
- Only owner, admin, or manager memberships can create farms.
- The existing save_farm_boundary RPC is used; no new database schema or migration is required.
- No service-role key or third-party geocoding API is introduced.
- Map tiles use the configured NEXT_PUBLIC_MAP_TILE_URL or the OpenStreetMap standard tile endpoint with attribution.

## Interpretation and legal limits
- The polygon is a user-declared agricultural boundary, not cadastral verification or proof of land ownership.
- The declared area and PostGIS-calculated geodesic area are stored/displayed separately.
- A primary crop name is user-entered; this stage does not infer crop type from satellite imagery.
- The user may still save a farm without a polygon and complete mapping later from the farm card.

## Validation still required
- Test authenticated create flow with an owner/manager account.
- Test denied create flow for viewer membership.
- Draw and save a polygon in Cabinda and compare the server-calculated hectares against a known GIS reference.
- Verify map rendering and form usability on mobile and desktop.
