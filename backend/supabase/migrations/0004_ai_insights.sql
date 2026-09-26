-- Cached daily AI nutrition insight per user, so the Dashboard doesn't call
-- the LLM provider on every page load (respects free-tier rate limits).

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  insight_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, insight_date)
);

create index if not exists idx_ai_insights_user_date on ai_insights(user_id, insight_date);
