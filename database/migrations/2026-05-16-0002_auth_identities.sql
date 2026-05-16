-- Sprint 2 foundation: auth identity persistence
-- Scope: authentication identities only, no profile or contribution entities.

create table if not exists auth_identities (
  id text primary key,
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_auth_identities_email on auth_identities (email);
create index if not exists idx_auth_identities_username on auth_identities (username);
