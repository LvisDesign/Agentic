# Setlla (setlla.com) — Transparent Property Rental Marketplace & Instant Inspection Engine
> Mobile-first, production-ready web application for residential property rentals in **Delta State, Nigeria** (Asaba, Warri, Abraka, Ughelli, Sapele, Agbor, Oleh, Effurun) with clean expansion patterns for other Nigerian states.

---

## 🌟 Core System Architecture

### 1. Instagram/TikTok Style Snap-Scroll Property Feed
- Viewport-optimized feed container (`h-[100dvh] overflow-y-scroll snap-y snap-mandatory`).
- High-impact media carousel with multi-image gallery and vertical video reel simulation.
- Editorial display typography (Reckless serif style) displaying Nigerian Naira pricing (`₦[Amount]/year`).
- Verified Agent pills with CAC accreditation numbers and response time badges.
- Keyboard navigation shortcuts (Arrow Up / Down / Page Down / Page Up).

### 2. Transparent Move-in Cost Schedule
- Prominent Total Move-in Package calculation in display serif font.
- Itemized breakdown schedule:
  - **Base Rent** (per annum / per month)
  - **Caution Deposit** (refundable security deposit)
  - **Legal & Agency Agreement Fee** (10% + 10% statutory agreement)
  - **Estate Service Charge** (security, waste disposal, borehole power)
- Delta State Tenancy Fair Practice Protection policy: guarantees zero hidden gate or surprise move-in fees.

### 3. Inspection Booking & Queue Engine (Strict Concurrency Cap)
- **Hourly Concurrency Cap:** Strictly **5 persons** per hourly window block.
- **State Machine:**
  - `REQUEST_SUBMITTED`: If current count `< 5`, slot is reserved directly; awaits verified agent acceptance.
  - `QUEUED`: If current count `== 5`, slot locks with Coral Crimson alert (`#F0544F`); applicant joins Standby Waitlist Queue with real-time queue position (`#1`, `#2`).
  - `ACCEPTED_PENDING_PAYMENT`: Once agent accepts, or if an active slot cancels, the next queued applicant automatically advances.
  - `PAYMENT_PROCESSING`: Paystack escrow clearance fee checkout (`₦2,000`–`₦3,500`).
  - `CONFIRMED_UNLOCKED`: Settlement reveals direct agent contact, phone call, 1-click WhatsApp deep link, verified physical street address, and digital QR gate pass.

### 4. Pay-to-Reveal Micro-Payment Flow (Paystack Gateway Simulation)
- Authentic Paystack branded checkout sheet.
- Supports **Card** (with 1-click "Autofill Demo Card"), **Bank Transfer** (Titan/Wema virtual account with 30:00 countdown timer), and **USSD** (`*737*...`, `*966*...`).
- Confetti celebration upon settlement.

### 5. Verified Contact & Digital Gate Pass
- Direct phone call link (`tel:+234...`) and WhatsApp deep link (`https://wa.me/234...`).
- Verified physical street address with landmark.
- Digital Pass reference code (`DT-ASB-8492`), estate gate security clearance code (`GATE-8821`), and simulated QR code.

### 6. Agent Onboarding & Management Dashboard
- Authenticated profile with CAC verification badge.
- Live metrics: Total fees generated in escrow, active listings count, pending queue requests.
- Incoming booking approvals manager with **Accept Booking** and **Decline Slot** controls (triggering automated standby queue advancement).
- Listing publishing form:
  - Delta city selector (Asaba, Warri, Abraka, Ughelli, Sapele, etc.)
  - Currency-masked cost inputs in `₦`
  - Media uploader with video reel support
  - Inspection day and window rule configuration.

---

## 🎨 Design System & Token Specifications

| Token | Name | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas** | Soft Linen | `#FCF9F5` | Main page background |
| **Surface** | Pure White | `#FFFFFF` | Cards, drawers, modal sheets |
| **Primary** | Cobalt Blue | `#275DAD` | Action buttons, verified seals, focus rings |
| **Neutral** | Slate Cool Gray | `#70798C` | Metadata, secondary labels, subtext |
| **Ink** | Deep Obsidian | `#000004` | Typography headings, high-contrast text |
| **Alert** | Coral Crimson | `#F0544F` | Limit reached (5/5), standby queue tags |
| **Display Font** | Reckless / Georgia | Serif | Page headings, large pricing |
| **UI Font** | Roobert / Sans-serif | System-ui | Inputs, buttons, tags, cards |
| **Elevation** | Subtle / Card | `0 1px 3px rgba(0,0,4,0.04), 0 6px 16px rgba(0,0,4,0.06)` | Cards, floating pills |

---

## 🚀 Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5173/
   ```

4. **Testing Features:**
   - **Role Toggle:** Switch between **Seeker Feed** and **Agent Portal** in the top navigation header.
   - **Mobile Device Frame Toggle:** Toggle between full-screen responsive mode and a simulated smartphone frame on desktop.
   - **Flow Guide:** Click the "Flow Guide" button in the header for an interactive explanation of the queue and pay-to-reveal flow.
