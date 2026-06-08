# Mobile Auto Repair — Project Documentation

**Version:** 1.0 · **Last updated:** 2026-06-07 · **Domain:** [www.mobile-auto-repair.ca](https://www.mobile-auto-repair.ca)

This document is the single source of truth for the Mobile Auto Repair website. It explains what was built, how services are wired together, where bugs are most likely to appear, and how to troubleshoot them.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [External Services](#4-external-services)
5. [Domain & Hosting](#5-domain--hosting)
6. [Repository Structure](#6-repository-structure)
7. [Routes & Pages](#7-routes--pages)
8. [Components Inventory](#8-components-inventory)
9. [Database Schema](#9-database-schema)
10. [Row Level Security (RLS)](#10-row-level-security-rls)
11. [Storage Buckets](#11-storage-buckets)
12. [API Endpoints](#12-api-endpoints)
13. [Email Flow](#13-email-flow)
14. [Customer Journey](#14-customer-journey)
15. [Admin Panel](#15-admin-panel)
16. [Analytics & Tracking](#16-analytics--tracking)
17. [SEO Setup](#17-seo-setup)
18. [Feature Flags](#18-feature-flags)
19. [Environment Variables](#19-environment-variables)
20. [Deployment Workflow](#20-deployment-workflow)
21. [Known Limitations & Troubleshooting](#21-known-limitations--troubleshooting)
22. [Future Improvements](#22-future-improvements)
23. [Credentials & Access Map](#23-credentials--access-map)

---

## 1. Project Overview

**Business:** Mobile Auto Repair — a mobile mechanic service in London, Ontario. The mechanic drives to the customer's location to perform diagnostics, repairs, ECU tuning, brake jobs, battery replacements, pre-purchase inspections and other automotive work on-site.

**Service area:** London, ON + immediate surroundings (St. Thomas, Strathroy and nearby towns).

**Phone:** 519-617-7214 · **Email:** mobile-auto-repair@outlook.com

**Working hours:** Monday – Saturday, 8:00 AM – 6:00 PM (Sunday closed)

**Minimum charge:** $80 CAD per on-site service call.

**Primary goals of the website:**

- Capture appointment requests online so customers don't have to call
- Help customers self-estimate cost via a guided wizard before booking
- Showcase trust signals (5-star Google reviews, brand specialty)
- Rank well in local Google search for "mobile mechanic London Ontario" and related terms
- Give the owner a single admin dashboard for bookings, availability, reviews and analytics

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | **React 18** + **Vite 5** | Fast HMR, modern tooling, simple bundler |
| Routing | **Custom path-based router** in `App.jsx` | No external library; small bundle |
| Styling | Plain CSS with **CSS Variables** | No framework lock-in, easy to maintain |
| Icons | **lucide-react** | Modern, tree-shakable icon set |
| Backend (DB+Auth+Storage) | **Supabase** (Postgres 17) | Single platform for DB, auth, file storage |
| Serverless functions | **Vercel Node.js Functions** (`/api/*`) | Email + confirmation links |
| Email delivery | **Resend** | Transactional email, simple API |
| Hosting | **Vercel** (Hobby plan) | Free, auto-deploys on git push |
| Domain | **Spaceship.com** | Domain registrar with DNS panel |
| Analytics | Custom Supabase tracking + Microsoft Clarity | Cookie-less first-party + heatmaps |
| Search Console | **Google Search Console** | SEO performance tracking |
| Keep-alive | **cron-job.org** | Prevents Supabase free-tier pause |

---

## 3. Architecture Diagram

```
                                    ┌─────────────────────────┐
                                    │  Customer's Browser     │
                                    │  (mobile or desktop)    │
                                    └───────────┬─────────────┘
                                                │ HTTPS
                                                ▼
                                    ┌─────────────────────────┐
                                    │  Vercel CDN (Edge)      │
                                    │  www.mobile-auto-       │
                                    │  repair.ca              │
                                    └───────┬─────────┬───────┘
                                            │         │
                                  ┌─────────┘         └──────────┐
                                  ▼                              ▼
                  ┌──────────────────────────────┐   ┌────────────────────┐
                  │  React SPA                   │   │  Vercel API Routes │
                  │  /, /booking, /tuning,       │   │  /api/send-email   │
                  │  /faq, /admin, etc.          │   │  /api/confirm-     │
                  └──────────┬───────────────────┘   │      booking       │
                             │ HTTPS                 │  /api/ping         │
                             ▼                       └─────────┬──────────┘
                  ┌──────────────────────────────┐             │
                  │  Supabase                    │◄────────────┘
                  │  - Postgres DB               │
                  │  - Auth (admin login)        │
                  │  - Storage (review photos)   │
                  │  - RLS policies              │
                  └──────────────────────────────┘
                             │
                             │ (also reads from)
                             ▼
                  ┌──────────────────────────────┐
                  │  External APIs               │
                  │  - NHTSA vPIC (vehicle data) │
                  │  - Resend (email send)       │
                  └──────────────────────────────┘

           ┌──────────────────────┐
           │  cron-job.org        │ ──────► GET /api/ping every 5 days
           │  (keep-alive)        │         (prevents Supabase auto-pause)
           └──────────────────────┘

           ┌──────────────────────┐
           │  Google              │
           │  - Search Console    │ ────► reads sitemap.xml + crawls site
           │  - Microsoft Clarity │ ────► loads tracking script
           └──────────────────────┘
```

---

## 4. External Services

| Service | Purpose | Account / Console URL |
|---------|---------|----------------------|
| **Supabase** | Database + Auth + Storage | https://supabase.com/dashboard (Project: `udporjlwjwsmmouvflkk`) |
| **Vercel** | Hosting + serverless functions + DNS edge | https://vercel.com/gamingtubemk-8104s-projects |
| **Spaceship** | Domain registrar (mobile-auto-repair.ca) | https://spaceship.com |
| **Resend** | Transactional email | https://resend.com |
| **Microsoft Clarity** | Session recordings + heatmaps | https://clarity.microsoft.com |
| **Google Search Console** | SEO performance | https://search.google.com/search-console |
| **cron-job.org** | Periodic ping to keep Supabase awake | https://cron-job.org |
| **NHTSA vPIC API** | Vehicle make/model lookup in Estimator | https://vpic.nhtsa.dot.gov/api/ (public, no auth) |

**API keys / secrets that must be set in Vercel environment variables:**

- `RESEND_API_KEY` — for sending booking-confirmation emails
- `NOTIFY_EMAIL` — owner's address for booking notifications (`mobile-auto-repair@outlook.com`)
- `VITE_CLARITY_ID` — Microsoft Clarity project ID (only set in production)
- `VITE_SUPABASE_URL` (optional — has fallback)
- `VITE_SUPABASE_ANON_KEY` (optional — has fallback, key is safe to embed)

---

## 5. Domain & Hosting

### Domain

- **Apex:** `mobile-auto-repair.ca` → 308 Permanent Redirect → `www.mobile-auto-repair.ca`
- **Canonical:** `https://www.mobile-auto-repair.ca/`

### DNS records (at Spaceship)

| Host | Type | Value | Purpose |
|------|------|-------|---------|
| `@` | A | `216.198.79.1` | Apex points to Vercel |
| `www` | CNAME | `a24601486db1b492.vercel-dns-017.com.` | www subdomain → Vercel |
| `@` | TXT | `google-site-verification=nwuEJjFdQy69bqsJEoyIqIrFsuE6UjOLgD6I7Q7RKZw` | Google Search Console ownership |

### SSL

Auto-managed by Vercel. Let's Encrypt certificates renewed automatically.

### Vercel routing (`vercel.json`)

- `/api/:path*` → serverless functions
- Everything that doesn't match a static file → `/index.html` (SPA fallback)
- Static files (`.html`, `.xml`, `.txt`, images, fonts, JS, CSS) fall through to Vercel's static handler so files like `sitemap.xml` and the Google verification HTML are served directly.

---

## 6. Repository Structure

```
mobile-auto-repair/
├── api/                            # Vercel serverless functions
│   ├── send-email.js               # POST: notifies owner of booking/quote
│   ├── confirm-booking.js          # GET: one-click confirm via token
│   └── ping.js                     # GET: keep-alive endpoint for cron
├── public/                         # Static assets served at site root
│   ├── assets/                     # Service & hero images
│   ├── Logos/                      # Brand logos (Toyota, BMW, etc.)
│   ├── og-image.jpg                # Open Graph preview image
│   ├── robots.txt
│   ├── sitemap.xml
│   └── googled1e62...html          # GSC ownership verification
├── src/
│   ├── App.jsx                     # Root router + tracker
│   ├── main.jsx                    # ReactDOM entry
│   ├── index.css                   # Global CSS + theme variables
│   ├── components/                 # Reusable React components
│   ├── pages/                      # Top-level page components (one per route)
│   ├── data/                       # Static data (Estimator categories, etc.)
│   ├── utils/                      # Helpers (NHTSA, page meta, tracker)
│   ├── lib/
│   │   └── supabase.js             # Supabase client + anon key
│   └── config/
│       └── features.js             # Feature flag definitions
├── index.html                      # Single HTML template (meta, schema)
├── vercel.json                     # Routing config
├── vite.config.js                  # Vite + dev-server proxy config
├── package.json
└── docs/
    └── PROJECT_DOCUMENTATION.md    # This file
```

---

## 7. Routes & Pages

All routes are handled in `src/App.jsx` by reading `window.location.pathname`.

### Public routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Home.jsx` | Hero, services catalogue, process, Estimator, About, contact form, Testimonials |
| `/booking` | `Booking.jsx` | 3-step appointment-request wizard (Service → Date+Time → Contact) |
| `/tuning` | `Tuning.jsx` | ECU tuning landing with vehicle lookup |
| `/pre-purchase-inspection` (alias: `/inspection`) | `PrePurchaseInspection.jsx` | PPI sales page with 6-card checklist |
| `/review` (alias: `/reviews`) | `Reviews.jsx` | Customer review submission form with photo upload |
| `/faq` | `FAQ.jsx` | 15 FAQs in collapsible accordion + FAQPage JSON-LD |
| `/privacy` | `Privacy.jsx` | PIPEDA-compliant privacy policy |
| `/terms` | `Terms.jsx` | Terms of service (incl. $80 minimum disclosure) |

### Admin routes (Supabase Auth required)

| Path | Component | Purpose |
|------|-----------|---------|
| `/admin` | `AdminLogin.jsx` → `Admin.jsx` | Single-page admin dashboard with collapsible sections |

### Fallback

Anything else falls through to `NotFound.jsx` (404 page).

---

## 8. Components Inventory

### Layout

- **Navbar.jsx** — Top nav with logo, links (Services, Book, Tuning, About, Reviews, FAQ, Get Estimate CTA). Auto-derives `/`-prefix on subpages.
- **Footer.jsx** — Quick links + contact info + Privacy / Terms.

### Home page widgets

- **Estimator.jsx** — 4-step quote wizard (Vehicle → Problem → Details → Result). Uses NHTSA API for makes/models.
- **BrandMarquee.jsx** — Drag-scrollable infinite logo strip; logos live in `/public/Logos/`.
- **WhyChooseMe.jsx** — Animated "Made to Work" section.
- **Testimonials.jsx** — Paginated review carousel; self-scrolls into view on hash-link.

### Forms

- **Booking.jsx** (page) — Calendar-based booking with `getSlotStatus()` returning `free`, `limited`, `taken`, `blocked`.
- **Reviews.jsx** (page) — Review form with client-side image compression (canvas → 1600px JPEG).
- **AdminLogin.jsx** — Email + password Supabase Auth.

### Global utilities

- **StickyCallButton.jsx** — Floating "Call Now" button (mobile only, scroll-aware position).
- **CookieBanner.jsx** — One-time consent, localStorage-backed, optional Clarity opt-out.

### Admin

- **Admin.jsx** — Single large component (~1500 LOC) with 6 sections:
  1. Appointments table (filter, edit, status changes)
  2. Manage Availability (week calendar, click-to-block, drag-to-reschedule)
  3. Analytics (collapsible, custom dashboard)
  4. Customer Reviews (moderation)
  5. Feature Toggles
  6. Deploy / Preview

### Utility hooks & modules

- **utils/usePageMeta.js** — Per-route title, description, canonical URL, OG title/desc updater.
- **utils/trackPageView.js** — Fire-and-forget anonymous analytics event.
- **utils/nhtsa.js** — Cached fetchers for NHTSA vehicle data.
- **lib/supabase.js** — Single Supabase client export.
- **config/features.js** — Feature flag merge (defaults + localStorage overrides).

---

## 9. Database Schema

Supabase project: `udporjlwjwsmmouvflkk` · Region: `us-west-2`

### `public.bookings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, default `gen_random_uuid()` |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `name` | TEXT | Customer name (NOT NULL, but admin-created entries can be empty) |
| `phone` | TEXT | Customer phone |
| `vehicle` | TEXT | Default `''` |
| `service_type` | TEXT | `diagnose`, `reparatur`, `tuning`, `wartung`, `sonstiges`, `blocked` |
| `booking_date` | DATE | Requested service date |
| `time_slot` | TEXT | 2-hour window ID e.g. `08:00-10:00` (5 slots/day, customer-facing) |
| `start_time` | TIME | Minute-precise — admin can override the slot |
| `end_time` | TIME | Minute-precise |
| `status` | TEXT | `pending`, `confirmed`, `completed`, `cancelled`, `blocked` |
| `notes` | TEXT | Default `''` |
| `admin_notes` | TEXT | Default `''` |
| `confirm_token` | TEXT | UUIDv4 used by one-click email-confirm link |

### `public.reviews`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `created_at` | TIMESTAMPTZ | |
| `customer_name` | TEXT | |
| `rating` | SMALLINT | 1–5 |
| `comment` | TEXT | |
| `vehicle` | TEXT NULL | |
| `service_type` | TEXT NULL | |
| `status` | TEXT | `pending`, `approved`, `hidden` |
| `booking_id` | UUID NULL | |
| `photo_urls` | TEXT[] | Default `'{}'` — public URLs into the `review-photos` bucket |
| `source` | TEXT | `website` (default), `google`, `manual` |

### `public.page_views` (analytics)

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT | Identity PK |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `path` | TEXT | Page path visited |
| `referrer` | TEXT NULL | document.referrer |
| `source` | TEXT | Classified: `google`, `search`, `social`, `internal`, `direct`, `other` |
| `user_agent` | TEXT NULL | Capped at 500 chars |
| `device` | TEXT | `mobile`, `tablet`, `desktop` |
| `session_id` | TEXT | Random UUID stored in `sessionStorage` (tab-scoped) |
| `language` | TEXT NULL | `navigator.language` |
| `screen_w` | SMALLINT | Browser screen width |

Indexes on `created_at DESC`, `path`, `source`, `session_id`.

---

## 10. Row Level Security (RLS)

All tables have RLS enabled. Policies summary:

### `bookings`

| Policy | Cmd | Role | Condition |
|--------|-----|------|-----------|
| `anon_insert_bookings` | INSERT | anon | true (customers create requests) |
| `anon_read_slots` | SELECT | anon | true (calendar reads taken slots) |
| `admin_select_bookings` | SELECT | authenticated | true |
| `admin_insert_bookings` | INSERT | authenticated | true |
| `admin_update_bookings` | UPDATE | authenticated | true |
| `admin_delete_bookings` | DELETE | authenticated | true |
| `anon_confirm_booking_by_token` | UPDATE | anon | `confirm_token IS NOT NULL AND status='pending'`, only sets `status='confirmed'` |

### `reviews`

| Policy | Cmd | Role | Condition |
|--------|-----|------|-----------|
| `Anyone can insert reviews` | INSERT | anon + authenticated | true |
| `Public can read approved reviews` | SELECT | anon | `status='approved'` |
| `Authenticated can read all reviews` | SELECT | authenticated | true |
| `Authenticated can update reviews` | UPDATE | authenticated | true |
| `Authenticated can delete reviews` | DELETE | authenticated | true |

### `page_views`

| Policy | Cmd | Role | Condition |
|--------|-----|------|-----------|
| `anyone_insert_page_view` | INSERT | public | true |
| `admin_select_page_views` | SELECT | authenticated | true |
| `admin_delete_page_views` | DELETE | authenticated | true (used by the Reset button) |

### `storage.objects` (review-photos bucket)

| Policy | Cmd | Role | Condition |
|--------|-----|------|-----------|
| `anyone_upload_review_photos` | INSERT | public | `bucket_id='review-photos'` |
| `public_read_review_photos` | SELECT | public | `bucket_id='review-photos'` |
| `admin_delete_review_photos` | DELETE | authenticated | `bucket_id='review-photos'` |

---

## 11. Storage Buckets

| Bucket | Public | File-size limit | Allowed types | Used for |
|--------|--------|----------------|---------------|----------|
| `review-photos` | Yes (read) | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | Photos uploaded with customer reviews. Stored under `pending/<uuid>.jpg`. |

---

## 12. API Endpoints

Located in `/api/` and served as Vercel serverless functions.

### `POST /api/send-email`

Triggers a Resend email to the owner when a customer books or requests a quote.

**Body (JSON):**

| Field | Required | Notes |
|-------|----------|-------|
| `type` | yes | `'booking'` or `'quote'` |
| `subject` | no | Overrides default subject |
| `name` | no | Customer name |
| `phone` | no | |
| `vehicle` | no | |
| `details` | no | Free-text body |
| `bookingId` | no | For booking emails — embeds the Confirm link |
| `confirmToken` | no | For booking emails |

**Behavior:**
- Reads `RESEND_API_KEY` and `NOTIFY_EMAIL` from env vars
- Sends from `Mobile Auto Repair <onboarding@resend.dev>` (Resend's verified default)
- If `bookingId` + `confirmToken` provided, includes a green **"✅ Confirm Booking"** button that hits `/api/confirm-booking?id=…&token=…`

### `GET /api/confirm-booking?id=…&token=…`

One-click confirmation from the owner's email.

**Logic:**
- Loads Supabase URL/key from env (with fallback)
- PATCHes the matching booking row to `status='confirmed'` — RLS policy ensures only `pending` rows with the right `confirm_token` can be updated
- Returns a styled HTML success page (or error page)

### `GET /api/ping`

Keep-alive ping called every 5 days by cron-job.org to prevent Supabase free-tier auto-pause.

Returns: `{ ok: true, ts: '<ISO timestamp>' }`

---

## 13. Email Flow

```
Customer submits booking
       │
       ▼
Browser writes to bookings table (anon role)
       │
       ▼
Browser fires POST /api/send-email
       │     {type, name, phone, vehicle, details, bookingId, confirmToken}
       ▼
Vercel function calls Resend API
       │
       ▼
Owner receives email at mobile-auto-repair@outlook.com
       │
       │   Contents:
       │   - Subject: "🗓️ New Appointment Request – Date Time – Name"
       │   - Customer details
       │   - "✅ Confirm Booking" button → /api/confirm-booking?id=...&token=...
       │   - "🔧 Open Admin Panel" link
       ▼
Owner clicks "Confirm Booking"
       │
       ▼
GET /api/confirm-booking?id=…&token=…
       │
       ▼
Supabase PATCH bookings SET status='confirmed'
       │   (RLS: anon_confirm_booking_by_token — requires valid token, pending status)
       ▼
HTML success page rendered, owner closes tab
```

**Important:** Resend free-tier requires the `to:` address to exactly match the email registered with the Resend account. The `NOTIFY_EMAIL` env var should match the Resend account email.

---

## 14. Customer Journey

```
┌────────────┐   1. Google search   ┌──────────────────┐
│ Prospect   │ ─────────────────►   │ www.mobile-      │
└────────────┘                      │ auto-repair.ca   │
                                    └────────┬─────────┘
                                             │
        ┌────────────────────────────────────┼──────────────────────────┐
        ▼                                    ▼                          ▼
  ┌──────────────┐                ┌──────────────────┐         ┌──────────────┐
  │ Estimator    │                │ Direct to        │         │ Call directly│
  │ wizard       │                │ /booking         │         │ 519-617-7214 │
  │ /#estimator  │                │                  │         └──────────────┘
  └──────┬───────┘                └────────┬─────────┘
         │ "Book Appointment" CTA          │
         │ stores estimate to               │
         │ sessionStorage                   │
         ▼                                  ▼
  ┌────────────────────────────────────────────────────┐
  │ /booking — 3-step wizard                           │
  │   Step 1: Service category                         │
  │   Step 2: Date + Time slot (calendar)              │
  │   Step 3: Contact details (Name, Phone, optional   │
  │           Vehicle, Problem)                        │
  └─────────────────────┬──────────────────────────────┘
                        │
                        ▼
            Insert into bookings table
            Send notification email
                        │
                        ▼
            Customer sees success screen + scroll-to-top
                        │
                        ▼
            Owner calls customer to confirm by phone
                        │
                        ▼
            Customer arrives at appointment, work is done
                        │
                        ▼
            Owner asks for review → /review
                        │
                        ▼
            Customer leaves review (status: pending)
                        │
                        ▼
            Admin approves → shows on homepage Testimonials
```

---

## 15. Admin Panel

URL: `/admin` (requires Supabase Auth login)

Sections from top to bottom:

1. **Appointments table** — Filter Upcoming/All, Confirm/Cancel/Complete/Delete, Edit modal, status badges. Sticky Actions column on mobile.
2. **Manage Availability** — Week-grid calendar with 5 × 2-hour slots/day:
   - Click slot → entry modal pre-filled
   - Click blocked slot → unblock immediately
   - "Block Day" / "Unblock Day" toggle per day column
   - Drag appointment cards to other days to reschedule (time preserved)
   - "+ Add" button at bottom of each day column
   - Each card has small ✕ for delete (cancel with confirm for real bookings, no-confirm for blocked slots)
3. **Analytics** — Collapsed by default. Time-range filter (1/7/30/90 days). KPIs, daily trend chart, top pages, traffic sources, devices, busiest hours. Reset button (testing only).
4. **Customer Reviews** — Pending / Approved / All filters. Approve / Hide / Mark Pending / Delete / Edit. Shows uploaded photos.
5. **Feature Toggles** — localStorage-backed flags for instant browser-level overrides, then "Deploy" to push permanent changes via local server.
6. **Deploy** — Requires local Node.js admin server at `localhost:3001` (separate setup, not part of Vercel). Writes `features.js`, git commit + push.
7. **Preview** — Link to open homepage in new tab.

### Auto-refresh

After any mutation (status change, edit, drag, etc.), the appointments + availability data are re-fetched from Supabase to keep the UI in sync. `refreshTick` state increments and forces both load effects to re-run.

---

## 16. Analytics & Tracking

Two parallel systems:

### Custom Supabase analytics (in admin)

- `utils/trackPageView.js` is called once on every route mount from `App.jsx`
- Skips `/admin` so the owner doesn't pollute their own numbers
- Stores anonymous data: path, referrer, classified source, user-agent, device, session ID (in sessionStorage, NOT cookie), language, screen width
- Admin dashboard aggregates client-side
- Reset button wipes the table (used during testing)

### Microsoft Clarity (external)

- Loaded via `index.html` script template `%VITE_CLARITY_ID%`
- Only fires if `VITE_CLARITY_ID` env var is set in Vercel
- Provides session recordings + heatmaps
- Cookie banner has an opt-out (calls `clarity('consent', false)`)

### Google Search Console (external)

- Ownership verified via DNS TXT record
- Sitemap submitted at `https://www.mobile-auto-repair.ca/sitemap.xml`
- Reports: search queries, impressions, click-through-rate, indexing coverage, Core Web Vitals

---

## 17. SEO Setup

### Meta tags

- Per-page title, description, canonical URL via `usePageMeta` hook
- OpenGraph + Twitter Card meta for social previews
- `og:image` at `https://www.mobile-auto-repair.ca/og-image.jpg` (1200 × 630)

### Structured data (JSON-LD)

- **AutoRepair LocalBusiness schema** in `index.html` — covers business name, phone, address, hours, area served (London, St. Thomas, Strathroy), aggregate rating, services offered with descriptions + priceRange.
- **FAQPage schema** dynamically injected by `FAQ.jsx` on mount, removed on unmount.

### Crawling

- `public/robots.txt` allows all crawlers, disallows `/admin` and `/api/`
- `public/sitemap.xml` lists all 8 public URLs with priority + changefreq

### Verification

- Google Search Console verified via DNS TXT (`google-site-verification=…`)
- Backup verification via meta tag in `index.html`
- Old HTML verification file still present at `/public/googled1e62…html`

---

## 18. Feature Flags

Defined in `src/config/features.js`. Defaults merged with `localStorage['mar_features']` overrides.

| Flag | Default | Purpose |
|------|---------|---------|
| `ESTIMATOR_SHOW_PRICE` | `false` | Show preliminary CAD price range on Estimator result |
| `ESTIMATOR_ENABLED` | `true` | Show/hide entire 4-step Estimator section + navbar link |
| `SHOW_REVIEW_PHOTOS` | `true` | Display photos in Testimonials (upload still works either way) |
| `STICKY_CALL_BUTTON` | `true` | Show floating Call Now button on mobile |

**How to change:**
- **Instantly (one browser only):** Admin → Feature Toggles → flip switch → Save
- **Permanently (all visitors):** Admin → Deploy Now (requires local Node admin server at `localhost:3001`)

---

## 19. Environment Variables

### Vercel (production)

| Variable | Value | Required? |
|----------|-------|-----------|
| `RESEND_API_KEY` | Provided by Resend dashboard | Yes (for email) |
| `NOTIFY_EMAIL` | `mobile-auto-repair@outlook.com` | Yes (for email) |
| `VITE_CLARITY_ID` | Provided by Clarity dashboard | No (Clarity only loads if set) |
| `VITE_SUPABASE_URL` | `https://udporjlwjwsmmouvflkk.supabase.co` | Optional (hardcoded fallback) |
| `VITE_SUPABASE_ANON_KEY` | Long JWT string | Optional (hardcoded fallback) |

### Local dev

Create `.env.local` if you want to override anything. Vite reads `VITE_*` vars at build time.

---

## 20. Deployment Workflow

```
Developer edits code
       │
       ▼
git commit && git push origin main
       │
       ▼
GitHub webhook → Vercel
       │
       ▼
Vercel runs: npm install + vite build
       │
       ▼
Built assets deployed to Vercel CDN
       │
       ▼
Live in ~30-60 seconds
```

Every push to `main` auto-deploys to production. There's no preview/staging branch by default — but Vercel auto-creates preview deployments for pull requests if used.

**Alternative deploys:**

- Admin's "Deploy Now" button writes `features.js`, commits and pushes via a local Node server at `localhost:3001`. Used only for the feature-toggle workflow.

---

## 21. Known Limitations & Troubleshooting

### Supabase free-tier auto-pause

After 7 days of inactivity, the project pauses. `cron-job.org` hits `/api/ping` every 5 days to prevent this.

**Symptom:** "Couldn't save" errors, customer can't book, admin can't log in.
**Fix:** Visit `https://supabase.com/dashboard` — the project will auto-resume in ~1-2 minutes. Verify the cron-job is still active.

### Email not arriving

**Possible causes:**
- `RESEND_API_KEY` not set or invalid in Vercel env vars
- `NOTIFY_EMAIL` doesn't match the email registered with Resend (free tier requires exact match)
- Email in spam folder

**Debug:**
- Check Vercel function logs for `[send-email]` lines
- Try GET `https://www.mobile-auto-repair.ca/api/ping` — confirms Vercel routes work
- Inspect Resend dashboard for delivery logs

### Customer booking but admin doesn't see it

**Cause:** Admin's calendar data isn't auto-refreshed when a customer books via the public site (only on admin-initiated actions).
**Workaround:** Refresh the admin page, or click any control (which triggers `refreshFromDb`).
**Possible improvement:** Add Supabase Realtime subscription.

### Image too large on mobile

Service images in `/public/assets/` are 500 KB–900 KB PNGs. Slow on 3G.
**Improvement:** Convert to WebP, target 100-200 KB each.

### No social-share preview image

**Symptom:** Sharing on WhatsApp/Facebook shows no thumbnail.
**Check:** `https://www.mobile-auto-repair.ca/og-image.jpg` must return a real 1200×630 image (Content-Type `image/jpeg`). If it returns HTML, the SPA rewrite is intercepting it — fix is already in `vercel.json` but verify the file is present in `/public/`.

### Microsoft Clarity not tracking

**Check:** `https://www.mobile-auto-repair.ca/` source should contain `clarity.ms` script. If it shows `%VITE_CLARITY_ID%` literally, the env var isn't set in Vercel.
**Fix:** Vercel → Settings → Environment Variables → add `VITE_CLARITY_ID` → Redeploy.

### Hash navigation lands on wrong section

If a section is async-rendered (e.g. Testimonials waits for Supabase), the browser's native hash-scroll fires before the element exists. The Home component polls every 200ms for up to 3s to scroll once the element appears. If a section is still missing after that, check console for Supabase errors.

### Admin Edit button shows old data

The Edit modal copies a snapshot of the booking when opened. If you make changes elsewhere first then open Edit on a stale row, you'd be editing old data. Close + reopen to get fresh state.

---

## 22. Future Improvements

Ordered roughly by impact-to-effort:

1. **Google Business Profile** — Single highest-impact for local SEO. No code change needed; user must register at business.google.com.
2. **Convert PNG service images to WebP** — Reduces mobile load by ~70%.
3. **Supabase Realtime** — Live updates in admin when customer books while admin is viewing.
4. **Customer confirmation email** — Currently only owner gets one. Customer should receive a receipt with details.
5. **24h appointment reminder** — Vercel Cron + Resend, reduces no-shows.
6. **Post-service review request** — Auto-email after `status='completed'` linking to `/review`.
7. **Brand identity / logo design** — Replace text-only logo with a proper mark + icon.
8. **WCAG 2.1 AA accessibility audit** — Currently we have basics; not comprehensive.
9. **French translation** — Ontario has French-speaking customers, opens new audience.
10. **React Error Boundary** — Prevents whole-page blank on component crash.
11. **Code-splitting** — Estimator + Booking + Tuning as separate chunks reduces initial bundle.
12. **Per-page server-side rendering** (move to Astro/Next.js) — Faster initial page-load + better SEO for subpages.

---

## 23. Credentials & Access Map

Confidential information — **do not commit actual passwords or keys to git**.

| Service | Login URL | Account | Notes |
|---------|-----------|---------|-------|
| GitHub | https://github.com/GamingTubeProg/mobile-auto-repair | GamingTubeProg | Repository owner |
| Vercel | https://vercel.com | gamingtubemk-8104 | Project: mobile-auto-repair |
| Supabase | https://supabase.com/dashboard | (project owner email) | Project ID: udporjlwjwsmmouvflkk |
| Resend | https://resend.com | mobile-auto-repair@outlook.com | Free tier — restricted `to:` address |
| Spaceship | https://spaceship.com | (domain owner) | DNS for mobile-auto-repair.ca |
| Microsoft Clarity | https://clarity.microsoft.com | (Microsoft account) | Project ID stored in Vercel env |
| Google Search Console | https://search.google.com/search-console | (Google account) | Verified for mobile-auto-repair.ca |
| cron-job.org | https://cron-job.org | (free account) | Pings /api/ping every 5 days |

---

## Appendix A: Common file-by-file edit cheatsheet

| Task | File |
|------|------|
| Change business phone number | `src/components/Footer.jsx`, `src/components/StickyCallButton.jsx`, `index.html` (Schema), `api/send-email.js` |
| Change business email | `src/components/Footer.jsx`, `src/pages/Home.jsx`, `api/send-email.js` (`FALLBACK_TO`), `index.html` (Schema) |
| Change working hours | `index.html` (Schema), `src/pages/Booking.jsx` (`TIME_SLOTS`), `src/pages/Admin.jsx` (`ADM_TIME_SLOTS` and `RANGE_TO_SLOTS`) |
| Update minimum charge in legal text | `src/pages/Terms.jsx`, `src/pages/FAQ.jsx` |
| Add/edit a service tile on homepage | `src/pages/Home.jsx` (`services` array) |
| Add a new public route | `src/App.jsx` (add `if (path === '/x') return ...`), create page component in `src/pages/`, add to `public/sitemap.xml` |
| Change Estimator categories | `src/data/estimatorData.js` |
| Change Tuning vehicle list | `src/data/tuningData.js` |
| Toggle a feature site-wide | Admin panel → Feature Toggles → Deploy Now (writes to `src/config/features.js`) |

---

*End of document. For questions, contact the original developer or the project owner.*
