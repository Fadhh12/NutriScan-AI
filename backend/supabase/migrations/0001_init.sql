-- NutriScan AI initial schema
-- Ref: SDD 3.2 Database Schema

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  daily_calorie_target integer check (daily_calorie_target between 800 and 6000),
  created_at timestamptz not null default now()
);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  image_url text not null,
  detected_food_name text,
  confidence_score numeric(4, 3),
  portion_estimate_g numeric(8, 2),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists scan_nutrition (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  calories numeric(8, 2) not null,
  protein_g numeric(8, 2) not null default 0,
  carbs_g numeric(8, 2) not null default 0,
  fat_g numeric(8, 2) not null default 0,
  fiber_g numeric(8, 2) not null default 0,
  sugar_g numeric(8, 2) not null default 0
);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  scan_id uuid references scans(id) on delete cascade,
  log_date date not null default current_date,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz not null default now()
);

create table if not exists food_reference (
  id uuid primary key default gen_random_uuid(),
  food_name text not null,
  calories_per_100g numeric(8, 2) not null,
  protein_per_100g numeric(8, 2) not null default 0,
  carbs_per_100g numeric(8, 2) not null default 0,
  fat_per_100g numeric(8, 2) not null default 0,
  source text
);

create index if not exists idx_scans_user_id on scans(user_id);
create index if not exists idx_daily_logs_user_id_date on daily_logs(user_id, log_date);
create index if not exists idx_scan_nutrition_scan_id on scan_nutrition(scan_id);
