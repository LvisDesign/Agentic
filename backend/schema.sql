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

-- 7. Platform Users & Super Admin Roles Table
create table if not exists public.platform_users (
  id text primary key,
  full_name text not null,
  phone text not null,
  email text,
  state text default 'Delta State',
  city text default 'Asaba',
  preferred_property_type text,
  budget numeric default 0,
  -- nin removed from platform requirements
  is_verified_tenant boolean default false,
  is_agent boolean default false,
  agency_name text,
  cac_number text,
  whatsapp text,
  operating_state text default 'Delta State',
  operating_city text default 'Asaba',
  agent_type text default 'agency',
  is_admin boolean default false,
  is_super_admin boolean default false,
  is_suspended boolean default false,
  suspension_reason text,
  kyc_status text default 'not_submitted',
  kyc_documents jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_users_phone on public.platform_users (phone);
create index if not exists idx_users_role on public.platform_users (is_agent, is_admin);

-- Ensure all platform user profile columns exist
alter table public.platform_users add column if not exists saved_listing_ids jsonb default '[]'::jsonb;
alter table public.platform_users add column if not exists avatar_url text;
alter table public.platform_users add column if not exists last_profile_edit_at timestamp with time zone;

-- 8. Admin Audit Trail Table
create table if not exists public.admin_audit_logs (
  id text primary key,
  action text not null,
  target_type text not null,
  target_id text not null,
  target_name text not null,
  admin_name text not null default 'Platform Administrator',
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_audit_time on public.admin_audit_logs (created_at desc);

-- 9. Platform Global Settings Table
create table if not exists public.platform_settings (
  id text primary key default 'global_config',
  default_inspection_fee numeric default 2500,
  max_queue_limit_per_slot integer default 5,
  maintenance_mode boolean default false,
  emergency_announcement text,
  emergency_announcement_active boolean default false,
  auto_approve_verified_agent_listings boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. Enable RLS and Realtime for Admin Tables
alter table public.platform_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.platform_settings enable row level security;

grant all on table public.platform_users to anon, authenticated;
grant all on table public.admin_audit_logs to anon, authenticated;
grant all on table public.platform_settings to anon, authenticated;

drop policy if exists "Public access platform_users" on public.platform_users;
create policy "Public access platform_users" on public.platform_users for all using (true) with check (true);

drop policy if exists "Public access admin_audit_logs" on public.admin_audit_logs;
create policy "Public access admin_audit_logs" on public.admin_audit_logs for all using (true) with check (true);

drop policy if exists "Public access platform_settings" on public.platform_settings;
create policy "Public access platform_settings" on public.platform_settings for all using (true) with check (true);

-- Enable Realtime for admin audit logs and users
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'platform_users'
  ) then
    alter publication supabase_realtime add table public.platform_users;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'admin_audit_logs'
  ) then
    alter publication supabase_realtime add table public.admin_audit_logs;
  end if;
end $$;

-- =========================================================================
-- 11. Advertising & Sponsored Campaigns Infrastructure
-- Supports 3 ingestion methods:
--   1. Admin Direct Upload (Super Admin entry)
--   2. Self-Service Partner Portal (Web submissions with pending approval)
--   3. Programmatic Push API / Webhook (Ingestion via partner API key)
-- =========================================================================

create table if not exists public.adverts (
  id text primary key,
  title text,
  headline text not null,
  advertiser_name text not null,
  advertiser_handle text,
  avatar_url text,
  category text not null default 'Promo' check (category in ('Property', 'Estate', 'Promo', 'Service')),
  badge_text text default 'SPONSORED',
  thumbnail_url text,
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  description text,
  location text default 'Nationwide',
  price text,
  cta_text text default 'Learn More',
  website_url text,
  action_type text default 'website' check (action_type in ('website', 'contact', 'property')),
  whatsapp_number text,
  phone text,
  is_verified boolean default false,
  
  -- Campaign Lifecycle & Ingestion Method
  status text not null default 'active' check (status in ('pending_review', 'active', 'paused', 'expired', 'rejected', 'deleted')),
  submission_source text default 'admin' check (submission_source in ('admin', 'partner_portal', 'api_webhook')),
  partner_email text,
  package_tier text default 'growth',
  budget_amount numeric default 0,
  start_date timestamp with time zone default timezone('utc'::text, now()),
  end_date timestamp with time zone,
  
  -- Engagement & Performance Tracking
  impressions_count integer default 0,
  clicks_count integer default 0,
  likes_count integer default 0,
  comments_count integer default 0,
  shares_count integer default 0,
  
  -- Programmatic Integration Reference
  api_key_ref text,
  property_id text,

  -- Shadow / Draft Edit Pattern (Platform Integrity & Re-Approval)
  has_pending_changes boolean default false,
  pending_changes jsonb default null,
  changes_review_status text default null check (changes_review_status in ('pending', 'rejected', null)),
  changes_rejection_reason text,

  -- Admin Rejection Reason & Feedback
  rejection_reason text,
  rejected_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_adverts_status on public.adverts (status, start_date, end_date);
create index if not exists idx_adverts_category on public.adverts (category);

-- Partner API Keys Table (For Programmatic Webhook / Push API access)
create table if not exists public.partner_api_keys (
  id text primary key,
  company_name text not null,
  api_key text unique not null,
  contact_email text not null,
  contact_phone text,
  is_active boolean default true,
  rate_limit_per_day integer default 100,
  requests_today integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_used_at timestamp with time zone
);

create index if not exists idx_partner_key on public.partner_api_keys (api_key);

-- Storage Bucket for Ad Creatives (High-res 9:16 vertical stories and banner graphics)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-creatives',
  'ad-creatives',
  true,
  20971520, -- 20MB max file size
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];

-- Storage Security Policies for ad-creatives bucket
drop policy if exists "Public Ad Creatives Access" on storage.objects;
create policy "Public Ad Creatives Access" on storage.objects for select using (bucket_id = 'ad-creatives');

drop policy if exists "Public Ad Creatives Upload" on storage.objects;
create policy "Public Ad Creatives Upload" on storage.objects for insert with check (bucket_id = 'ad-creatives');

-- RLS & Grants for Adverts and Partner Keys
alter table public.adverts enable row level security;
alter table public.partner_api_keys enable row level security;

grant all on table public.adverts to anon, authenticated;
grant all on table public.partner_api_keys to anon, authenticated;

-- Policies
drop policy if exists "Public can view active adverts" on public.adverts;
create policy "Public can view active adverts" on public.adverts
  for select using (
    status = 'active' and 
    (start_date is null or start_date <= timezone('utc'::text, now())) and
    (end_date is null or end_date > timezone('utc'::text, now()))
  );

drop policy if exists "Partners can submit adverts" on public.adverts;
create policy "Partners can submit adverts" on public.adverts
  for insert with check (true);

drop policy if exists "Admin full management adverts" on public.adverts;
create policy "Admin full management adverts" on public.adverts
  for all using (true) with check (true);

drop policy if exists "Admin manage partner keys" on public.partner_api_keys;
create policy "Admin manage partner keys" on public.partner_api_keys
  for all using (true) with check (true);

-- Enable Realtime for adverts table so new ads broadcast instantly to all users
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'adverts'
  ) then
    alter publication supabase_realtime add table public.adverts;
  end if;
end $$;

-- =========================================================================
-- 12. Ads Customers & Brand Partner Accounts Table
-- Enables corporate advertisers, property developers, and agencies to sign up,
-- log in, and manage their campaigns from their private advertiser dashboard.
-- =========================================================================

create table if not exists public.advertisers (
  id text primary key,
  company_name text not null,
  contact_name text not null,
  email text unique not null,
  phone text not null,
  whatsapp text,
  password_hash text,
  industry text default 'Real Estate & Properties',
  operating_city text default 'Asaba',
  website_url text,
  logo_url text,
  api_key text,
  account_status text default 'active' check (account_status in ('active', 'suspended', 'pending')),
  total_spent numeric default 0,
  wallet_balance numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  last_login_at timestamp with time zone
);

-- Idempotent migrations for existing deployments
alter table public.advertisers add column if not exists wallet_balance numeric default 0;
alter table public.adverts add column if not exists has_pending_changes boolean default false;
alter table public.adverts add column if not exists pending_changes jsonb default null;
alter table public.adverts add column if not exists changes_review_status text default null;
alter table public.adverts add column if not exists changes_rejection_reason text default null;

create index if not exists idx_advertisers_email on public.advertisers (email);
create index if not exists idx_advertisers_status on public.advertisers (account_status);

alter table public.advertisers enable row level security;
grant all on table public.advertisers to anon, authenticated;

drop policy if exists "Advertiser public signup" on public.advertisers;
create policy "Advertiser public signup" on public.advertisers
  for insert with check (true);

drop policy if exists "Advertiser manage own profile" on public.advertisers;
create policy "Advertiser manage own profile" on public.advertisers
  for all using (true) with check (true);

-- Enable Realtime for advertisers table
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'advertisers'
  ) then
    alter publication supabase_realtime add table public.advertisers;
  end if;
end $$;

-- =========================================================================
-- 13. Tombstones for Deleted Adverts (Cross-Device Mobile & Web Instant Purge)
-- Ensures when an admin or customer deletes an ad, it vanishes instantly
-- from all mobile devices and never resurrects.
-- =========================================================================

create table if not exists public.deleted_adverts (
  id text primary key,
  deleted_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_deleted_adverts_time on public.deleted_adverts (deleted_at desc);

alter table public.deleted_adverts enable row level security;
grant all on table public.deleted_adverts to anon, authenticated;

drop policy if exists "Public access deleted_adverts" on public.deleted_adverts;
create policy "Public access deleted_adverts" on public.deleted_adverts for all using (true) with check (true);

-- Enable Realtime for deleted_adverts table
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'deleted_adverts'
  ) then
    alter publication supabase_realtime add table public.deleted_adverts;
  end if;
end $$;

-- 14. Idempotent Migration Helpers for Existing Supabase Databases
alter table public.adverts add column if not exists rejection_reason text;
alter table public.adverts add column if not exists rejected_at timestamp with time zone;
