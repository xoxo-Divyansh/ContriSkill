# ADR-002: Auth and Session Strategy

- **Status:** Proposed
- **Date:** 2026-05-13
- **Owner:** Architecture + Security

## Context

ContriSkill requires authenticated identity, trust-sensitive collaboration, moderation visibility, and future session governance. The platform vision supports email/password and Google authentication, but the exact operational session model has not yet been finalized.

## Proposed Decision

Use:

- email/password authentication
- Google OAuth as an optional provider
- short-lived access tokens
- rotating refresh sessions
- server-tracked session records
- secure password hashing

For browser clients, prefer secure cookie-based refresh handling over exposing long-lived tokens directly to client-side code.

## Why

- supports low-friction onboarding
- improves session revocation and device awareness
- aligns with a trust-centered platform where account control matters
- creates a stronger foundation for moderation and suspicious-session handling

## Consequences

- authentication must be treated as a first-class domain, not only a login screen
- session records likely need persistence and audit metadata
- API contracts should separate authentication events from profile and trust events

## OPEN DECISION

- Which auth library or implementation approach should be used in the future implementation phase?
- Should refresh tokens be single-use rotating tokens or bounded multi-use sessions?
- What CSRF protections are required for the final browser session model?
- Is MFA required for moderators or high-trust accounts in MVP or only post-MVP?
