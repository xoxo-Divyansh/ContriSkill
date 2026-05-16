-- Sprint 2 foundation: auth session persistence
-- Scope: session store only, no user table migrations included here.

create table if not exists auth_sessions (
  id text primary key,
  user_id text not null,
  role text not null,
  state text not null check (state in ('authenticated', 'expired')),
  access_token_hash text not null unique,
  refresh_token_hash text not null unique,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null,
  revoked_at timestamptz null
);

create index if not exists idx_auth_sessions_user_id on auth_sessions (user_id);
create index if not exists idx_auth_sessions_expires_at on auth_sessions (expires_at);
create index if not exists idx_auth_sessions_revoked_at on auth_sessions (revoked_at);
