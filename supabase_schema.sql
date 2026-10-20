-- DeltaRent Supabase Database Schema & Realtime Setup
-- Copy and paste this script into your Supabase project's SQL Editor (https://supabase.com/dashboard) and click RUN.

-- 1. Create Listings Table
create table if not exists public.listings (
  id text primary key,
  title text not null,
  state text not null default 'Delta State',
  city text not null,
  neighborhood text not null,
  full_address text,
  property_type text not null,
  bedrooms integer default 1,
  bathrooms integer default 1,
  toilets integer default 1,
  is_serviced boolean default false,
  is_furnished boolean default false,
  electricity_status text,
  water_supply text,
  description text,
  media jsonb not null default '[]'::jsonb,
  fees jsonb not null default '{}'::jsonb,
  inspection_fee numeric default 0,
  agent jsonb not null default '{}'::jsonb,
  inspection_slots jsonb default '[]'::jsonb,
  inspection_days jsonb default '[]'::jsonb,
  tags text[] default array[]::text[],
  addons text[] default array[]::text[],
  availability_status text default 'Available',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_confirmed_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Bookings Table
create table if not exists public.bookings (
  id text primary key,
  property_id text not null,
  slot_id text,
  slot_time_window text,
  slot_date text,
  applicant_name text not null,
  applicant_phone text not null,
  applicant_email text,
  status text not null default 'REQUEST_SUBMITTED',
  queue_position integer,
  inspection_fee_amount numeric default 0,
  payment_reference text,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  confirmed_at timestamp with time zone
);

-- 3. Enable Row Level Security (RLS)
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

-- 4. Create Public Access Policies (Allows read, create, and update from web clients)
drop policy if exists "Public can read listings" on public.listings;
create policy "Public can read listings" on public.listings for select using (true);

drop policy if exists "Public can insert listings" on public.listings;
create policy "Public can insert listings" on public.listings for insert with check (true);

drop policy if exists "Public can update listings" on public.listings;
create policy "Public can update listings" on public.listings for update using (true);

drop policy if exists "Public can read bookings" on public.bookings;
create policy "Public can read bookings" on public.bookings for select using (true);

drop policy if exists "Public can insert bookings" on public.bookings;
create policy "Public can insert bookings" on public.bookings for insert with check (true);

drop policy if exists "Public can update bookings" on public.bookings;
create policy "Public can update bookings" on public.bookings for update using (true);

-- 5. Enable Supabase Realtime broadcast for instant updates
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.bookings;
