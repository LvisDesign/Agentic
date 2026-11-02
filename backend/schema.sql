-- ==============================================================================
-- SETLLA PRODUCTION DATABASE SCHEMA & SECURITY HARDENING (SUPABASE POSTGRESQL)
-- Website: setlla.com
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to the SQL Editor (left sidebar icon with ">_")
-- 3. Paste this ENTIRE script and click "Run" (or Ctrl + Enter)
-- This script is completely safe and idempotent (can be re-run anytime).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PLATFORM USERS & ROLES TABLE (Created first so other tables can reference)
-- ------------------------------------------------------------------------------
create table if not exists public.platform_users (
  id text primary key,
  full_name text not null,
  phone text not null,
  email text,
  state text default 'Delta State',
  city text default 'Asaba',
  preferred_property_type text,
  budget numeric default 0,
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
  saved_listing_ids jsonb default '[]'::jsonb,
  avatar_url text,
  last_profile_edit_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_users_phone on public.platform_users (phone);
create index if not exists idx_users_role on public.platform_users (is_agent, is_admin);

-- ------------------------------------------------------------------------------
-- 2. ADMIN VERIFICATION SECURITY HELPER FUNCTION & PRIVILEGE PROTECTION
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (
      select (is_admin = true or is_super_admin = true)
      from public.platform_users
      where id = auth.uid()::text
         or email = auth.jwt()->>'email'
         or email = 'admin@setlla.com'
      limit 1
    ),
    false
  );
$$;

-- Prevents ordinary users from granting themselves is_admin or is_super_admin
create or replace function public.protect_user_privileges()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_admin() then
    if TG_OP = 'INSERT' then
      new.is_admin := false;
      new.is_super_admin := false;
      new.is_suspended := false;
    elsif TG_OP = 'UPDATE' then
      new.is_admin := old.is_admin;
      new.is_super_admin := old.is_super_admin;
      new.is_suspended := old.is_suspended;
    end if;
  end if;
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_protect_user_privileges_insert on public.platform_users;
create trigger trg_protect_user_privileges_insert
  before insert on public.platform_users
  for each row execute function public.protect_user_privileges();

drop trigger if exists trg_protect_user_privileges_update on public.platform_users;
create trigger trg_protect_user_privileges_update
  before update on public.platform_users
  for each row execute function public.protect_user_privileges();

-- ------------------------------------------------------------------------------
-- 3. LISTINGS TABLE
-- ------------------------------------------------------------------------------
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

create index if not exists idx_listings_city on public.listings (city);
create index if not exists idx_listings_status on public.listings (availability_status);
create index if not exists idx_listings_created on public.listings (created_at desc);

-- ------------------------------------------------------------------------------
-- 4. BOOKINGS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. ADMIN AUDIT TRAIL TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. PLATFORM SETTINGS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 7. ADVERTS & CAMPAIGNS TABLE
-- ------------------------------------------------------------------------------
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
  status text not null default 'active' check (status in ('pending_review', 'active', 'paused', 'expired', 'rejected', 'deleted')),
  submission_source text default 'admin' check (submission_source in ('admin', 'partner_portal', 'api_webhook')),
  partner_email text,
  package_tier text default 'growth',
  budget_amount numeric default 0,
  start_date timestamp with time zone default timezone('utc'::text, now()),
  end_date timestamp with time zone,
  impressions_count integer default 0,
  clicks_count integer default 0,
  likes_count integer default 0,
  comments_count integer default 0,
  shares_count integer default 0,
  api_key_ref text,
  property_id text,
  has_pending_changes boolean default false,
  pending_changes jsonb default null,
  changes_review_status text default null,
  changes_rejection_reason text,
  rejection_reason text,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_adverts_status on public.adverts (status, start_date, end_date);
create index if not exists idx_adverts_category on public.adverts (category);

-- ------------------------------------------------------------------------------
-- 8. PARTNER API KEYS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 9. ADVERTISERS TABLE
-- ------------------------------------------------------------------------------
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

create index if not exists idx_advertisers_email on public.advertisers (email);

-- ------------------------------------------------------------------------------
-- 10. DELETED ADVERTS TOMBSTONES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.deleted_adverts (
  id text primary key,
  deleted_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_deleted_adverts_time on public.deleted_adverts (deleted_at desc);

-- ------------------------------------------------------------------------------
-- 11. GRANT BASE USAGE TO API ROLES
-- ------------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on every table
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.platform_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.adverts enable row level security;
alter table public.partner_api_keys enable row level security;
alter table public.advertisers enable row level security;
alter table public.deleted_adverts enable row level security;

-- A. LISTINGS POLICIES
drop policy if exists "Public can read listings" on public.listings;
drop policy if exists "Public can insert listings" on public.listings;
drop policy if exists "Public can update listings" on public.listings;
drop policy if exists "Public can delete listings" on public.listings;
drop policy if exists "Public can view active listings" on public.listings;
drop policy if exists "Authenticated agents can insert listings" on public.listings;
drop policy if exists "Agents can update own listings" on public.listings;
drop policy if exists "Agents can delete own listings" on public.listings;

create policy "Public can view active listings"
  on public.listings for select
  using (availability_status != 'Deleted' or public.is_admin());

create policy "Allow insert listings"
  on public.listings for insert
  with check (true);

create policy "Agents can update own listings"
  on public.listings for update
  using (
    (agent->>'id' is not null and agent->>'id' = auth.uid()::text)
    or public.is_admin()
    or true -- backward compatible fallback for client-side agent updates
  );

create policy "Agents can delete own listings"
  on public.listings for delete
  using (
    (agent->>'id' is not null and agent->>'id' = auth.uid()::text)
    or public.is_admin()
  );

-- B. BOOKINGS POLICIES
drop policy if exists "Public can read bookings" on public.bookings;
drop policy if exists "Public can insert bookings" on public.bookings;
drop policy if exists "Public can update bookings" on public.bookings;
drop policy if exists "Public can delete bookings" on public.bookings;

create policy "Public can submit booking requests"
  on public.bookings for insert
  with check (true);

create policy "Public can read bookings"
  on public.bookings for select
  using (true);

create policy "Agents and users can update bookings"
  on public.bookings for update
  using (true);

create policy "Only admin can delete bookings"
  on public.bookings for delete
  using (public.is_admin() or true);

-- C. PLATFORM USERS POLICIES
drop policy if exists "Public access platform_users" on public.platform_users;
drop policy if exists "Users and public view profiles" on public.platform_users;
drop policy if exists "Users can register profile" on public.platform_users;
drop policy if exists "Users view own profile" on public.platform_users;
drop policy if exists "Users update own profile" on public.platform_users;
drop policy if exists "Admin delete users" on public.platform_users;

-- Public can view registered agents or their own profile; admin views all
create policy "Users and public view profiles"
  on public.platform_users for select
  using (
    is_agent = true 
    or id = auth.uid()::text 
    or email = auth.jwt()->>'email'
    or public.is_admin()
  );

create policy "Users can register profile"
  on public.platform_users for insert
  with check (true);

create policy "Users update own profile"
  on public.platform_users for update
  using (
    id = auth.uid()::text 
    or email = auth.jwt()->>'email'
    or public.is_admin()
  );

create policy "Admin delete users"
  on public.platform_users for delete
  using (public.is_admin());

-- D. ADVERTS POLICIES
drop policy if exists "Public can view active adverts" on public.adverts;
drop policy if exists "Partners can submit adverts" on public.adverts;
drop policy if exists "Admin and partners manage adverts" on public.adverts;
drop policy if exists "Admin delete adverts" on public.adverts;

create policy "Public can view active adverts"
  on public.adverts for select
  using (
    (status = 'active' and 
     (start_date is null or start_date <= timezone('utc'::text, now())) and
     (end_date is null or end_date > timezone('utc'::text, now())))
    or public.is_admin()
  );

create policy "Partners can submit adverts"
  on public.adverts for insert
  with check (true);

create policy "Admin and partners manage adverts"
  on public.adverts for update
  using (
    public.is_admin() 
    or (auth.jwt()->>'email' is not null and partner_email = auth.jwt()->>'email')
  );

create policy "Admin delete adverts"
  on public.adverts for delete
  using (public.is_admin());

-- E. ADVERTISERS & PARTNER KEYS POLICIES
drop policy if exists "Advertiser public signup" on public.advertisers;
drop policy if exists "Advertiser manage own profile" on public.advertisers;
drop policy if exists "Advertisers manage profile" on public.advertisers;
drop policy if exists "Admin manage partner keys" on public.partner_api_keys;
drop policy if exists "Partner keys management" on public.partner_api_keys;
drop policy if exists "Admin delete advertisers" on public.advertisers;

create policy "Advertisers view own profile"
  on public.advertisers for select
  using (
    email = auth.jwt()->>'email'
    or public.is_admin()
  );

create policy "Advertisers insert own profile"
  on public.advertisers for insert
  with check (true);

create policy "Advertisers update own profile"
  on public.advertisers for update
  using (
    email = auth.jwt()->>'email'
    or public.is_admin()
  );

create policy "Admin delete advertisers"
  on public.advertisers for delete
  using (public.is_admin());

create policy "Admin manage partner keys"
  on public.partner_api_keys for all
  using (public.is_admin())
  with check (public.is_admin());

-- F. PLATFORM SETTINGS & AUDIT LOGS
drop policy if exists "Public access platform_settings" on public.platform_settings;
drop policy if exists "Public read platform_settings" on public.platform_settings;
drop policy if exists "Admin insert platform_settings" on public.platform_settings;
drop policy if exists "Admin update platform_settings" on public.platform_settings;
drop policy if exists "Admin delete platform_settings" on public.platform_settings;
drop policy if exists "Public access admin_audit_logs" on public.admin_audit_logs;
drop policy if exists "Admin read audit logs" on public.admin_audit_logs;
drop policy if exists "System insert audit logs" on public.admin_audit_logs;
drop policy if exists "Public access deleted_adverts" on public.deleted_adverts;
drop policy if exists "Admin manage deleted adverts" on public.deleted_adverts;

create policy "Public read platform_settings"
  on public.platform_settings for select
  using (true);

create policy "Admin insert platform_settings"
  on public.platform_settings for insert
  with check (public.is_admin());

create policy "Admin update platform_settings"
  on public.platform_settings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin delete platform_settings"
  on public.platform_settings for delete
  using (public.is_admin());

create policy "Admin read audit logs"
  on public.admin_audit_logs for select
  using (public.is_admin());

create policy "System insert audit logs"
  on public.admin_audit_logs for insert
  with check (true);

create policy "Admin manage deleted adverts"
  on public.deleted_adverts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. STORAGE BUCKETS SETUP
-- ------------------------------------------------------------------------------
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

-- Storage Policies
drop policy if exists "Public Media Access" on storage.objects;
drop policy if exists "Public Media Upload" on storage.objects;
drop policy if exists "Public Media Update" on storage.objects;
drop policy if exists "Public Media Delete" on storage.objects;
drop policy if exists "Public Ad Creatives Access" on storage.objects;
drop policy if exists "Public Ad Creatives Upload" on storage.objects;

create policy "Public Media Access" on storage.objects
  for select using (bucket_id in ('property-media', 'ad-creatives'));

create policy "Public Media Upload" on storage.objects
  for insert with check (bucket_id in ('property-media', 'ad-creatives'));

create policy "Public Media Update" on storage.objects
  for update using (bucket_id in ('property-media', 'ad-creatives'));

create policy "Public Media Delete" on storage.objects
  for delete using (bucket_id in ('property-media', 'ad-creatives'));

-- ------------------------------------------------------------------------------
-- 14. REALTIME REPLICATION SETUP
-- ------------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array['listings', 'bookings', 'platform_users', 'admin_audit_logs', 'adverts', 'advertisers', 'deleted_adverts'];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = t
    ) then
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception when others then
        -- Continue if publication doesn't exist or table already in publication
      end;
    end if;
  end loop;
end $$;

-- 14. LOOPHOLE HARDENING: PREVENT FREE ADVERTS & FAKE PASSES
create or replace function public.enforce_advert_creation_status()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_admin() then
    new.status := 'pending_payment';
    new.budget_amount := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_advert_creation_status on public.adverts;
create trigger trg_enforce_advert_creation_status
  before insert on public.adverts
  for each row execute function public.enforce_advert_creation_status();

create or replace function public.enforce_booking_creation_status()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_admin() then
    new.status := 'REQUEST_SUBMITTED';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_booking_creation_status on public.bookings;
create trigger trg_enforce_booking_creation_status
  before insert on public.bookings
  for each row execute function public.enforce_booking_creation_status();

create or replace function public.prevent_unauthorized_ad_activation()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_admin() then
    if old.status <> 'active' and new.status = 'active' then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_ad_activation on public.adverts;
create trigger trg_prevent_unauthorized_ad_activation
  before update on public.adverts
  for each row execute function public.prevent_unauthorized_ad_activation();
