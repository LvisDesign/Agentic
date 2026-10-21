# Setlla Backend (Supabase) - setlla.com

This directory contains the database schemas, seed data, and configuration for the **Setlla Realtime Backend**.

---

## Architecture Overview

Setlla uses **Supabase** (PostgreSQL + Realtime WebSockets + Row Level Security) as its cloud backend. 

- **Database:** PostgreSQL hosting property listings, inspection booking queues, and proof-of-life status.
- **Realtime Sync:** Subscribes to table change events so when an agent lists a property on their computer, it immediately appears on a tenant's mobile phone without refreshing.
- **Frontend Client:** Located in `src/services/` (`listingService.ts`, `bookingService.ts`, and `src/utils/supabaseClient.ts`).

---

## Files

1. **`schema.sql`**: The primary SQL script. Run this in the [Supabase SQL Editor](https://supabase.com/dashboard) to create the `listings` and `bookings` tables, indexes, security policies, and realtime broadcast publications.
2. **`seed.sql`**: Optional initial verified Delta State properties to populate the database.

---

## How to Connect

### 1. In Supabase Dashboard
1. Go to **SQL Editor** -> Click **New Query**.
2. Copy and paste `backend/schema.sql` and click **Run**.
3. Go to **Project Settings** -> **API** to copy:
   - **Project URL**
   - **anon / public key**

### 2. In Local Development
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. In Vercel (Production)
Go to your project on Vercel -> **Settings** -> **Environment Variables**, and add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
