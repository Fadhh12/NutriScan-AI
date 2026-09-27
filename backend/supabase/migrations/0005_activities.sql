-- Real activity logging (Activity Tracker page) — replaces the hardcoded
-- steps/weightlifting/run demo numbers with actual user-entered workouts.
-- calories_burned is computed server-side from activity_type + intensity +
-- duration (see services/activity.service.ts) so it can't be spoofed from
-- the client and stays consistent across entries.

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  activity_type text not null check (activity_type in ('walking', 'running', 'cycling', 'weightlifting', 'swimming', 'yoga', 'other')),
  intensity text not null check (intensity in ('low', 'medium', 'high')),
  duration_minutes integer not null check (duration_minutes > 0),
  calories_burned numeric not null check (calories_burned >= 0),
  log_date date not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_user_date on activities(user_id, log_date);
