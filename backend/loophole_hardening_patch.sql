-- ==============================================================================
-- SETLLA PLATFORM: COMPLETE LOOPHOLE HARDENING PATCH
-- Target: Supabase PostgreSQL Database
-- ==============================================================================
-- This script completely eliminates:
-- 1. Free Advert Creation exploit (forcing status = 'pending_payment')
-- 2. Free Inspection Pass exploit (forcing status = 'REQUEST_SUBMITTED')
-- 3. Unauthorized Campaign Activation exploit (blocking non-admin status changes)
-- ==============================================================================

-- 1. PREVENT FREE ADVERTS EXPLOIT
-- Enforces that non-admin inserts MUST have status 'pending_payment' and budget 0.
-- Even if an attacker passes status: 'active', the database trigger rewrites it.
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

-- 2. PREVENT FREE INSPECTION PASS EXPLOIT
-- Enforces that public booking submissions always start at 'REQUEST_SUBMITTED'.
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

-- 3. LOCK DOWN ADVERT STATUS UPDATES
-- Prevents non-admins from changing an advert's status to 'active'.
-- Only Paystack Webhook Edge Function (service role) or Super Admin can activate.
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

