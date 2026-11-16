# Security and privacy baseline

This document defines the minimum security expectations before SpaceXplore Tchiowa stores real farmer, organization, farm, parcel, or field data.

## Identity and sessions
- Use Supabase Auth with the supported Next.js server-side session integration.
- Protect authenticated routes and re-check authorization in server operations.
- Never trust client-provided organization IDs, roles, or ownership claims without a server/database authorization check.
- Use application-controlled role data; do not authorize from user-editable auth metadata.

## Database
- Enable RLS on every table exposed through the Data API.
- Scope records by organization membership and role, not merely by authenticated status.
- UPDATE policies must enforce both the existing row and the resulting row ownership.
- Restrict catalogue editing and administrative operations to designated roles.
- Use least-privilege grants and avoid privileged database functions unless explicitly reviewed.

## Secrets and configuration
- Never expose Supabase secret/service-role keys in client code or NEXT_PUBLIC variables.
- Commit only an environment template containing variable names and safe placeholders.
- Store production secrets in the deployment platform's encrypted environment settings.
- Rotate credentials if they are ever exposed.

## Storage
- Private by default.
- Scope object paths and policies to organization/farm permissions.
- Use short-lived signed URLs where appropriate.
- Validate file type, size, and ownership before accepting uploads.

## Application and provider access
- Validate inputs on the server.
- Apply request limits and timeouts to provider routes.
- Avoid logging tokens, credentials, private documents, or unnecessary personal data.
- Normalize external errors without returning secrets or internal stack traces.

## Operational controls
- Maintain dependency lockfiles and review security advisories.
- Review database security/performance advisors after schema changes.
- Maintain backups and test restoration before production onboarding.
- Record sensitive membership, role, and administrative changes in an audit trail.

## Privacy posture
- Collect only information needed for the stated agricultural workflows.
- Explain who can see each farm and organization record.
- Provide a process for data export, correction, and deletion before public onboarding.
- Do not treat precise farm coordinates, ownership records, or uploaded reports as public data.
