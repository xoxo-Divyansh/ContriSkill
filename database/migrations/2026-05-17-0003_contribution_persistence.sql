-- Phase 2 foundation: contribution persistence
-- Scope: contribution posts, applications, collaborations, and append-only contribution events.

create table if not exists contribution_posts (
  id text primary key,
  creator_user_id text not null,
  post_type text not null check (
    post_type in ('mentorship', 'collaboration', 'problem_solving', 'educational', 'community_safety')
  ),
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('low', 'medium', 'high')),
  credit_offer integer not null check (credit_offer > 0),
  state text not null check (
    state in ('open', 'in_review', 'accepted', 'in_progress', 'completed', 'verified', 'disputed', 'cancelled', 'expired')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contribution_applications (
  id text primary key,
  post_id text not null references contribution_posts (id) on delete cascade,
  applicant_user_id text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists contribution_collaborations (
  id text primary key,
  post_id text not null references contribution_posts (id) on delete cascade,
  requester_user_id text not null,
  contributor_user_id text not null,
  state text not null check (
    state in ('pending', 'active', 'awaiting_verification', 'verified', 'disputed', 'failed', 'cancelled', 'under_moderation')
  ),
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contribution_events (
  id text primary key,
  aggregate_type text not null check (aggregate_type in ('post', 'collaboration', 'verification', 'moderation')),
  aggregate_id text not null,
  event_type text not null,
  actor_user_id text null,
  payload_json jsonb null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contribution_posts_state_created_at
  on contribution_posts (state, created_at desc, id);
create index if not exists idx_contribution_posts_type_state_created_at
  on contribution_posts (post_type, state, created_at desc, id);
create index if not exists idx_contribution_applications_post_id_created_at
  on contribution_applications (post_id, created_at, id);
create index if not exists idx_contribution_collaborations_post_id
  on contribution_collaborations (post_id);
create index if not exists idx_contribution_collaborations_requester_state
  on contribution_collaborations (requester_user_id, state);
create index if not exists idx_contribution_collaborations_contributor_state
  on contribution_collaborations (contributor_user_id, state);
create index if not exists idx_contribution_events_aggregate
  on contribution_events (aggregate_type, aggregate_id, occurred_at, id);
