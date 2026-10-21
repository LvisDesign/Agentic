-- ==============================================================================
-- SETLLA BACKEND DATABASE SCHEMA (SUPABASE POSTGRESQL) - setlla.com
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- It creates the database tables, security policies (RLS), and enables Realtime.
-- ==============================================================================

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

-- Index for fast location and rent queries
create index if not exists idx_listings_city on public.listings (city);
create index if not exists idx_listings_status on public.listings (availability_status);
create index if not exists idx_listings_created on public.listings (created_at desc);

-- 2. Create Bookings Table
create table if not exists public.bookings (
  id text primary key,
  property_id text not null references public.listings(id) on delete cascade,
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

create index if not exists idx_bookings_prop on public.bookings (property_id);
create index if not exists idx_bookings_status on public.bookings (status);

-- 3. Enable Row Level Security (RLS)
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

-- 4. Grant table privileges to public api roles
grant usage on schema public to anon, authenticated;
grant all on table public.listings to anon, authenticated;
grant all on table public.bookings to anon, authenticated;

-- 5. Public Access Policies
drop policy if exists "Public can read listings" on public.listings;
create policy "Public can read listings" on public.listings for select using (true);

drop policy if exists "Public can insert listings" on public.listings;
create policy "Public can insert listings" on public.listings for insert with check (true);

drop policy if exists "Public can update listings" on public.listings;
create policy "Public can update listings" on public.listings for update using (true);

drop policy if exists "Public can delete listings" on public.listings;
create policy "Public can delete listings" on public.listings for delete using (true);

drop policy if exists "Public can read bookings" on public.bookings;
create policy "Public can read bookings" on public.bookings for select using (true);

drop policy if exists "Public can insert bookings" on public.bookings;
create policy "Public can insert bookings" on public.bookings for insert with check (true);

drop policy if exists "Public can update bookings" on public.bookings;
create policy "Public can update bookings" on public.bookings for update using (true);

drop policy if exists "Public can delete bookings" on public.bookings;
create policy "Public can delete bookings" on public.bookings for delete using (true);

-- 5. Enable Realtime Sync (idempotent, safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'listings'
  ) then
    alter publication supabase_realtime add table public.listings;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- 6. Storage Bucket for Property Walkthrough Videos and Photos
-- Enables agents to upload authentic HD walkthrough videos and photos directly to Supabase CDN
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  true,
  52428800, -- 50MB max file size
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];

-- Storage Security Policies for property-media bucket
drop policy if exists "Public Media Access" on storage.objects;
create policy "Public Media Access" on storage.objects for select using (bucket_id = 'property-media');

drop policy if exists "Public Media Upload" on storage.objects;
create policy "Public Media Upload" on storage.objects for insert with check (bucket_id = 'property-media');

drop policy if exists "Public Media Update" on storage.objects;
create policy "Public Media Update" on storage.objects for update using (bucket_id = 'property-media');

drop policy if exists "Public Media Delete" on storage.objects;
create policy "Public Media Delete" on storage.objects for delete using (bucket_id = 'property-media');

