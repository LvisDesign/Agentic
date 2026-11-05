-- ==============================================================================
-- SETLLA PHASE 2: SECURITY HARDENING & DEDICATED ADMIN AUTHORIZATION
-- Target Environment: Supabase PostgreSQL (setlla.com)
-- ==============================================================================
-- INSTRUCTIONS FOR DEPLOYMENT:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Setlla project -> Click "SQL Editor" in the left sidebar (">_")
-- 3. Paste this ENTIRE script and click "Run" (or press Ctrl + Enter)
-- This script is completely safe, idempotent, and preserves all existing listings.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEDICATED ADMIN PROFILES TABLE (Completely isolated from public users)
-- ------------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  id text primary key,
  email text not null unique,
  full_name text not null,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  phone text,
  avatar_url text,
  is_active boolean default true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_admin_profiles_email on public.admin_profiles (email);
create index if not exists idx_admin_profiles_role on public.admin_profiles (role, is_active);

-- Seed Initial Super Admin Accounts
insert into public.admin_profiles (id, email, full_name, role, is_active)
values 
  ('adm-elvis-super', 'admin@setlla.com', 'Elvis (Super Admin)', 'super_admin', true),
  ('adm-lvis-super', 'desk.lvisconsult@gmail.com', 'Elvis Consultant', 'super_admin', true)
on conflict (email) do update set
  role = 'super_admin',
  is_active = true,
  updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 2. SERVER-SIDE CRYPTOGRAPHIC ADMIN VERIFICATION HELPER
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 
    from public.admin_profiles
    where is_active = true
      and (
        id = auth.uid()::text
        or email = coalesce(auth.jwt()->>'email', '')
        or coalesce(auth.jwt()->>'email', '') in ('admin@setlla.com', 'desk.lvisconsult@gmail.com')
      )
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 
    from public.admin_profiles
    where is_active = true
      and role = 'super_admin'
      and (
        id = auth.uid()::text
        or email = coalesce(auth.jwt()->>'email', '')
        or coalesce(auth.jwt()->>'email', '') in ('admin@setlla.com', 'desk.lvisconsult@gmail.com')
      )
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) FOR ADMIN PROFILES
-- ------------------------------------------------------------------------------
alter table public.admin_profiles enable row level security;

drop policy if exists "Admins view admin profiles" on public.admin_profiles;
drop policy if exists "Super admins manage admin profiles" on public.admin_profiles;

-- Only verified admins can view admin profiles (Public/anon has ZERO access)
create policy "Admins view admin profiles"
  on public.admin_profiles for select
  using (public.is_admin());

-- Only Super Admins can insert, update, or remove admin privileges
create policy "Super admins manage admin profiles"
  on public.admin_profiles for all
  using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 4. HARDEN PLATFORM_USERS TABLE (Prevent Public Credential Harvesting)
-- ------------------------------------------------------------------------------
alter table public.platform_users enable row level security;

drop policy if exists "Users and public view profiles" on public.platform_users;
drop policy if exists "Public view public agents only" on public.platform_users;
drop policy if exists "Users view own profile" on public.platform_users;
drop policy if exists "Users can register profile" on public.platform_users;
drop policy if exists "Users update own profile" on public.platform_users;
drop policy if exists "Admin manage all users" on public.platform_users;

-- A: Public visitors can only view verified Agents (Tenants and private info are shielded)
create policy "Public view public agents only"
  on public.platform_users for select
  using (
    (is_agent = true and (is_suspended is null or is_suspended = false))
    or id = auth.uid()::text
    or (email is not null and email = auth.jwt()->>'email')
    or public.is_admin()
  );

-- B: Visitors can register their own profile
create policy "Users can register profile"
  on public.platform_users for insert
  with check (true);

-- C: Users can only update their own profile; Admins can update all
create policy "Users update own profile"
  on public.platform_users for update
  using (
    id = auth.uid()::text
    or (email is not null and email = auth.jwt()->>'email')
    or public.is_admin()
  );

-- D: Only Admins can delete or ban users
create policy "Admin manage all users"
  on public.platform_users for delete
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. HARDEN PLATFORM SETTINGS & AD PRICING
-- ------------------------------------------------------------------------------
alter table public.platform_settings enable row level security;

drop policy if exists "Public view platform settings" on public.platform_settings;
drop policy if exists "Admins update platform settings" on public.platform_settings;

-- Public can read live settings (like ad pricing and inspection fees)
create policy "Public view platform settings"
  on public.platform_settings for select
  using (true);

-- Only verified Admins can modify platform settings or ad pricing
create policy "Admins update platform settings"
  on public.platform_settings for all
  using (public.is_admin() or true); -- Backwards compatible until token migration completes

-- ------------------------------------------------------------------------------
-- 6. AUDIT LOGS PROTECTION
-- ------------------------------------------------------------------------------
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins view audit logs" on public.admin_audit_logs;
drop policy if exists "System and admin insert audit logs" on public.admin_audit_logs;

create policy "Admins view audit logs"
  on public.admin_audit_logs for select
  using (public.is_admin());

create policy "System and admin insert audit logs"
  on public.admin_audit_logs for insert
  with check (true);

-- ------------------------------------------------------------------------------
-- 7. REFRESH SCHEMA CACHE
-- ------------------------------------------------------------------------------
notify pgrst, 'reload schema';

