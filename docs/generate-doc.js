/**
 * Generates PROJECT_DOCUMENTATION.docx from the same source-of-truth content
 * that lives in PROJECT_DOCUMENTATION.md. Re-run any time content changes:
 *
 *   cd docs && node generate-doc.js
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, LevelFormat, Table, TableRow, TableCell,
  BorderStyle, WidthType, ShadingType,
  PageOrientation, TableOfContents, Bookmark, InternalHyperlink,
  Header, Footer, PageNumber,
} = require('docx');

// ── helpers ────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const allBorders = { top: border, bottom: border, left: border, right: border };
const HEADER_BG = 'E65C00';
const HEADER_TEXT = 'FFFFFF';

function p(text, opts = {}) {
  return new Paragraph({
    children: Array.isArray(text)
      ? text
      : [new TextRun({ text, size: opts.size || 22, ...opts })],
    spacing: { before: opts.before || 80, after: opts.after || 80 },
    alignment: opts.align,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 36, color: '1A1A1A' })],
    spacing: { before: 480, after: 200 },
    pageBreakBefore: true,
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, color: 'E65C00' })],
    spacing: { before: 280, after: 140 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, color: '333333' })],
    spacing: { before: 220, after: 110 },
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Consolas', size: 18 })],
    shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
    spacing: { before: 60, after: 60 },
  });
}

function table(headers, rows, columnWidths) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((label, i) =>
      new TableCell({
        borders: allBorders,
        width: { size: columnWidths[i], type: WidthType.DXA },
        shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, color: HEADER_TEXT, size: 18 })],
          }),
        ],
      })
    ),
  });
  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map((cellText, i) =>
        new TableCell({
          borders: allBorders,
          width: { size: columnWidths[i], type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: String(cellText), size: 18 })] })],
        })
      ),
    })
  );
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: [headerRow, ...dataRows],
  });
}

function spacer() { return new Paragraph({ children: [new TextRun('')] }); }

// ── content ────────────────────────────────────────────────────
const today = '2026-06-07';

const cover = [
  new Paragraph({
    spacing: { before: 4000, after: 200 },
    children: [new TextRun({ text: 'Mobile Auto Repair', bold: true, size: 64, color: 'E65C00' })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: 'Project Documentation', size: 36, color: '333333' })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: 'www.mobile-auto-repair.ca', size: 24, color: '666666' })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    spacing: { before: 200, after: 0 },
    children: [new TextRun({ text: 'Version 1.0  ·  ' + today, size: 22, color: '888888' })],
    alignment: AlignmentType.CENTER,
  }),
];

const toc = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: 'Table of Contents', bold: true, size: 36 })],
    pageBreakBefore: true,
  }),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
];

const sections = [];

// 1. Project Overview
sections.push(h1('1. Project Overview'));
sections.push(p('Mobile Auto Repair is a mobile mechanic service operating in London, Ontario. The mechanic drives to the customer’s location to perform diagnostics, repairs, ECU tuning, brake jobs, battery replacements, pre-purchase inspections and other automotive work on-site.'));
sections.push(p([
  new TextRun({ text: 'Service area: ', bold: true, size: 22 }),
  new TextRun({ text: 'London, ON + St. Thomas, Strathroy, and nearby towns.', size: 22 }),
]));
sections.push(p([
  new TextRun({ text: 'Phone: ', bold: true, size: 22 }),
  new TextRun({ text: '519-617-7214   ', size: 22 }),
  new TextRun({ text: 'Email: ', bold: true, size: 22 }),
  new TextRun({ text: 'mobile-auto-repair@outlook.com', size: 22 }),
]));
sections.push(p([
  new TextRun({ text: 'Working hours: ', bold: true, size: 22 }),
  new TextRun({ text: 'Monday – Saturday, 8:00 AM – 6:00 PM (Sunday closed).', size: 22 }),
]));
sections.push(p([
  new TextRun({ text: 'Minimum charge: ', bold: true, size: 22 }),
  new TextRun({ text: '$80 CAD per on-site service call.', size: 22 }),
]));
sections.push(h3('Primary goals of the website'));
[
  'Capture appointment requests online so customers don’t have to call',
  'Help customers self-estimate cost via a guided wizard before booking',
  'Showcase trust signals (5-star Google reviews, brand specialty)',
  'Rank well in local Google search for "mobile mechanic London Ontario" and related terms',
  'Give the owner a single admin dashboard for bookings, availability, reviews and analytics',
].forEach(t => sections.push(bullet(t)));

// 2. Tech Stack
sections.push(h1('2. Tech Stack'));
sections.push(table(
  ['Layer', 'Technology', 'Why'],
  [
    ['Frontend', 'React 18 + Vite 5', 'Fast HMR, modern tooling'],
    ['Routing', 'Custom path-based router in App.jsx', 'No external library, small bundle'],
    ['Styling', 'Plain CSS with CSS Variables', 'No framework lock-in'],
    ['Icons', 'lucide-react', 'Modern, tree-shakable'],
    ['Backend', 'Supabase (Postgres 17)', 'DB + Auth + Storage in one platform'],
    ['Serverless', 'Vercel Node.js Functions', 'Email + confirm links'],
    ['Email', 'Resend', 'Transactional email, simple API'],
    ['Hosting', 'Vercel (Hobby)', 'Auto-deploys on git push'],
    ['Domain', 'Spaceship', 'Registrar with DNS panel'],
    ['Analytics', 'Custom Supabase + Microsoft Clarity', 'First-party + heatmaps'],
    ['Search Console', 'Google Search Console', 'SEO performance'],
    ['Keep-alive', 'cron-job.org', 'Prevents Supabase free-tier pause'],
  ],
  [2200, 3600, 3560]
));

// 3. Architecture Diagram
sections.push(h1('3. Architecture Diagram'));
sections.push(p('Diagram shown as text for portability. Boxes are services, arrows indicate the direction of data flow.'));
[
  '                          Customer’s Browser',
  '                                  |',
  '                                  v',
  '                          Vercel CDN (Edge)',
  '                          www.mobile-auto-repair.ca',
  '                          /            \\',
  '                         v              v',
  '                  React SPA        Vercel API Routes',
  '                       |           /api/send-email',
  '                       |           /api/confirm-booking',
  '                       |           /api/ping',
  '                       v                |',
  '                  Supabase  <-----------+',
  '                  - Postgres DB',
  '                  - Auth (admin login)',
  '                  - Storage (review-photos bucket)',
  '                  - RLS policies',
  '                       |',
  '                       v',
  '                  External APIs',
  '                  - NHTSA vPIC (vehicle data)',
  '                  - Resend (email send)',
  '',
  '  cron-job.org  ---> GET /api/ping every 5 days (keep-alive)',
  '  Google        ---> reads sitemap + crawls public pages',
  '  Clarity       ---> loads tracking script on every page',
].forEach(line => sections.push(code(line)));

// 4. External Services
sections.push(h1('4. External Services'));
sections.push(table(
  ['Service', 'Purpose', 'Console URL'],
  [
    ['Supabase', 'Database, Auth, Storage', 'supabase.com/dashboard'],
    ['Vercel', 'Hosting + serverless + DNS edge', 'vercel.com'],
    ['Spaceship', 'Domain registrar', 'spaceship.com'],
    ['Resend', 'Transactional email', 'resend.com'],
    ['Microsoft Clarity', 'Session recordings + heatmaps', 'clarity.microsoft.com'],
    ['Google Search Console', 'SEO performance', 'search.google.com/search-console'],
    ['cron-job.org', 'Periodic /api/ping', 'cron-job.org'],
    ['NHTSA vPIC', 'Vehicle make/model lookup', 'vpic.nhtsa.dot.gov/api/'],
  ],
  [2800, 3500, 3060]
));
sections.push(h3('Required env vars in Vercel'));
sections.push(bullet('RESEND_API_KEY — for sending booking notifications'));
sections.push(bullet('NOTIFY_EMAIL — owner’s address (mobile-auto-repair@outlook.com)'));
sections.push(bullet('VITE_CLARITY_ID — Microsoft Clarity project ID (script skipped if unset)'));
sections.push(bullet('VITE_SUPABASE_URL (optional, has fallback)'));
sections.push(bullet('VITE_SUPABASE_ANON_KEY (optional, has fallback)'));

// 5. Domain & Hosting
sections.push(h1('5. Domain & Hosting'));
sections.push(h3('Domain'));
sections.push(p('Apex “mobile-auto-repair.ca” issues a 308 Permanent Redirect to “www.mobile-auto-repair.ca”. The canonical URL is the www version.'));
sections.push(h3('DNS records at Spaceship'));
sections.push(table(
  ['Host', 'Type', 'Value', 'Purpose'],
  [
    ['@', 'A', '216.198.79.1', 'Apex → Vercel'],
    ['www', 'CNAME', 'a24601486db1b492.vercel-dns-017.com.', 'www → Vercel'],
    ['@', 'TXT', 'google-site-verification=nwuEJjFdQy69bqsJEoyIqIrFsuE6UjOLgD6I7Q7RKZw', 'GSC ownership'],
  ],
  [1200, 1100, 5060, 2000]
));
sections.push(h3('SSL'));
sections.push(p('Auto-managed by Vercel. Let’s Encrypt certificates renewed automatically.'));
sections.push(h3('Vercel routing (vercel.json)'));
sections.push(bullet('/api/:path* → serverless functions'));
sections.push(bullet('Static files (.html, .xml, .txt, images, fonts, JS, CSS) fall through to the static handler'));
sections.push(bullet('Everything else → /index.html (SPA fallback for client-side routing)'));

// 6. Repository Structure
sections.push(h1('6. Repository Structure'));
[
  'mobile-auto-repair/',
  '├── api/                    Vercel serverless functions',
  '│   ├── send-email.js',
  '│   ├── confirm-booking.js',
  '│   └── ping.js',
  '├── public/                 Static assets served from /',
  '│   ├── assets/             Service & hero images',
  '│   ├── Logos/              Brand logos',
  '│   ├── og-image.jpg',
  '│   ├── robots.txt',
  '│   ├── sitemap.xml',
  '│   └── google...html       GSC verification',
  '├── src/',
  '│   ├── App.jsx             Root router + page-view tracker',
  '│   ├── main.jsx',
  '│   ├── index.css',
  '│   ├── components/         Reusable React components',
  '│   ├── pages/              One file per route',
  '│   ├── data/               Static datasets',
  '│   ├── utils/              Helpers (NHTSA, page meta, tracker)',
  '│   ├── lib/supabase.js',
  '│   └── config/features.js  Feature flags',
  '├── index.html              Single HTML template (meta, schema)',
  '├── vercel.json             Routing config',
  '├── vite.config.js',
  '└── docs/',
  '    ├── PROJECT_DOCUMENTATION.md',
  '    └── PROJECT_DOCUMENTATION.docx',
].forEach(line => sections.push(code(line)));

// 7. Routes & Pages
sections.push(h1('7. Routes & Pages'));
sections.push(h3('Public routes'));
sections.push(table(
  ['Path', 'Component', 'Purpose'],
  [
    ['/', 'Home.jsx', 'Hero, services, process, Estimator, About, contact, Testimonials'],
    ['/booking', 'Booking.jsx', '3-step appointment wizard'],
    ['/tuning', 'Tuning.jsx', 'ECU tuning landing'],
    ['/pre-purchase-inspection (alias /inspection)', 'PrePurchaseInspection.jsx', 'PPI sales page'],
    ['/review (alias /reviews)', 'Reviews.jsx', 'Review form with photo upload'],
    ['/faq', 'FAQ.jsx', '15 FAQs + FAQPage schema'],
    ['/privacy', 'Privacy.jsx', 'PIPEDA privacy policy'],
    ['/terms', 'Terms.jsx', 'Terms of service'],
  ],
  [3200, 2200, 3960]
));
sections.push(h3('Admin route'));
sections.push(table(
  ['Path', 'Component', 'Purpose'],
  [['/admin', 'AdminLogin.jsx → Admin.jsx', 'Single-page admin dashboard']],
  [3200, 2200, 3960]
));
sections.push(h3('Fallback'));
sections.push(p('Anything else falls through to NotFound.jsx (custom 404 page).'));

// 8. Components Inventory
sections.push(h1('8. Components Inventory'));
sections.push(h3('Layout'));
sections.push(bullet('Navbar.jsx — Logo + links + Get Estimate CTA; auto-derives "/" prefix on subpages.'));
sections.push(bullet('Footer.jsx — Quick links + contact + Privacy/Terms.'));
sections.push(h3('Home-page widgets'));
sections.push(bullet('Estimator.jsx — 4-step wizard; NHTSA-backed vehicle picker.'));
sections.push(bullet('BrandMarquee.jsx — Drag-scrollable infinite logo strip.'));
sections.push(bullet('WhyChooseMe.jsx — Animated "Made to Work" section.'));
sections.push(bullet('Testimonials.jsx — Paginated review carousel; self-scrolls on hash navigation.'));
sections.push(h3('Forms'));
sections.push(bullet('Booking.jsx — Calendar with getSlotStatus() returning free/limited/taken/blocked.'));
sections.push(bullet('Reviews.jsx — Review form with canvas-based image compression to ~200 KB JPEGs.'));
sections.push(bullet('AdminLogin.jsx — Email + password via Supabase Auth.'));
sections.push(h3('Global utilities'));
sections.push(bullet('StickyCallButton.jsx — Floating Call Now (mobile only, scroll-aware position).'));
sections.push(bullet('CookieBanner.jsx — One-time consent with optional Clarity opt-out.'));
sections.push(h3('Admin'));
sections.push(bullet('Admin.jsx — One large component containing 6 sections: Appointments, Manage Availability, Analytics, Customer Reviews, Feature Toggles, Deploy.'));
sections.push(h3('Hooks & modules'));
sections.push(bullet('utils/usePageMeta.js — Per-route document title + meta description + canonical.'));
sections.push(bullet('utils/trackPageView.js — Fire-and-forget anonymous analytics event.'));
sections.push(bullet('utils/nhtsa.js — Cached NHTSA fetchers.'));
sections.push(bullet('lib/supabase.js — Single Supabase client export.'));
sections.push(bullet('config/features.js — Defaults + localStorage overrides for feature flags.'));

// 9. Database Schema
sections.push(h1('9. Database Schema'));
sections.push(p('Supabase project ID: udporjlwjwsmmouvflkk · Region: us-west-2'));
sections.push(h3('public.bookings'));
sections.push(table(
  ['Column', 'Type', 'Notes'],
  [
    ['id', 'UUID', 'PK, default gen_random_uuid()'],
    ['created_at', 'TIMESTAMPTZ', 'Default now()'],
    ['name', 'TEXT', 'Customer name'],
    ['phone', 'TEXT', 'Customer phone'],
    ['vehicle', 'TEXT', 'Default “”'],
    ['service_type', 'TEXT', 'diagnose / reparatur / tuning / wartung / sonstiges / blocked'],
    ['booking_date', 'DATE', 'Requested service date'],
    ['time_slot', 'TEXT', '2-hour window ID (5 slots/day, customer-facing)'],
    ['start_time', 'TIME', 'Minute-precise (admin can override)'],
    ['end_time', 'TIME', 'Minute-precise'],
    ['status', 'TEXT', 'pending / confirmed / completed / cancelled / blocked'],
    ['notes', 'TEXT', 'Default “”'],
    ['admin_notes', 'TEXT', 'Default “”'],
    ['confirm_token', 'TEXT', 'UUIDv4 used by one-click confirm link'],
  ],
  [2400, 1800, 5160]
));
sections.push(h3('public.reviews'));
sections.push(table(
  ['Column', 'Type', 'Notes'],
  [
    ['id', 'UUID', 'PK'],
    ['created_at', 'TIMESTAMPTZ', ''],
    ['customer_name', 'TEXT', ''],
    ['rating', 'SMALLINT', '1–5'],
    ['comment', 'TEXT', ''],
    ['vehicle', 'TEXT NULL', ''],
    ['service_type', 'TEXT NULL', ''],
    ['status', 'TEXT', 'pending / approved / hidden'],
    ['booking_id', 'UUID NULL', ''],
    ['photo_urls', 'TEXT[]', 'Default {} — public URLs into review-photos bucket'],
    ['source', 'TEXT', 'website / google / manual'],
  ],
  [2400, 1800, 5160]
));
sections.push(h3('public.page_views'));
sections.push(table(
  ['Column', 'Type', 'Notes'],
  [
    ['id', 'BIGINT', 'Identity PK'],
    ['created_at', 'TIMESTAMPTZ', 'Default now()'],
    ['path', 'TEXT', 'Path visited'],
    ['referrer', 'TEXT NULL', 'document.referrer'],
    ['source', 'TEXT', 'Classified: google / search / social / internal / direct / other'],
    ['user_agent', 'TEXT NULL', 'Capped at 500 chars'],
    ['device', 'TEXT', 'mobile / tablet / desktop'],
    ['session_id', 'TEXT', 'Random UUID stored in sessionStorage (tab-scoped)'],
    ['language', 'TEXT NULL', 'navigator.language'],
    ['screen_w', 'SMALLINT', 'Browser screen width'],
  ],
  [2400, 1800, 5160]
));
sections.push(p('Indexes: created_at DESC, path, source, session_id.'));

// 10. RLS
sections.push(h1('10. Row Level Security (RLS)'));
sections.push(p('All tables have RLS enabled. Summary of policies:'));
sections.push(h3('bookings'));
sections.push(table(
  ['Policy', 'Cmd', 'Role', 'Condition'],
  [
    ['anon_insert_bookings', 'INSERT', 'anon', 'true (customers create requests)'],
    ['anon_read_slots', 'SELECT', 'anon', 'true (calendar reads taken slots)'],
    ['admin_select_bookings', 'SELECT', 'authenticated', 'true'],
    ['admin_insert_bookings', 'INSERT', 'authenticated', 'true'],
    ['admin_update_bookings', 'UPDATE', 'authenticated', 'true'],
    ['admin_delete_bookings', 'DELETE', 'authenticated', 'true'],
    ['anon_confirm_booking_by_token', 'UPDATE', 'anon', 'token + status=pending; can only set status=confirmed'],
  ],
  [2800, 1100, 1400, 4060]
));
sections.push(h3('reviews'));
sections.push(table(
  ['Policy', 'Cmd', 'Role', 'Condition'],
  [
    ['Anyone can insert reviews', 'INSERT', 'anon + auth', 'true'],
    ['Public can read approved reviews', 'SELECT', 'anon', 'status=approved'],
    ['Authenticated can read all reviews', 'SELECT', 'authenticated', 'true'],
    ['Authenticated can update reviews', 'UPDATE', 'authenticated', 'true'],
    ['Authenticated can delete reviews', 'DELETE', 'authenticated', 'true'],
  ],
  [3200, 1100, 1500, 3560]
));
sections.push(h3('page_views'));
sections.push(table(
  ['Policy', 'Cmd', 'Role', 'Condition'],
  [
    ['anyone_insert_page_view', 'INSERT', 'public', 'true'],
    ['admin_select_page_views', 'SELECT', 'authenticated', 'true'],
    ['admin_delete_page_views', 'DELETE', 'authenticated', 'true (used by Reset button)'],
  ],
  [2800, 1100, 1500, 3960]
));
sections.push(h3('storage.objects (review-photos)'));
sections.push(table(
  ['Policy', 'Cmd', 'Role', 'Condition'],
  [
    ['anyone_upload_review_photos', 'INSERT', 'public', "bucket_id='review-photos'"],
    ['public_read_review_photos', 'SELECT', 'public', "bucket_id='review-photos'"],
    ['admin_delete_review_photos', 'DELETE', 'authenticated', "bucket_id='review-photos'"],
  ],
  [3000, 1100, 1500, 3760]
));

// 11. Storage Buckets
sections.push(h1('11. Storage Buckets'));
sections.push(table(
  ['Bucket', 'Public', 'File-size limit', 'Allowed types', 'Used for'],
  [['review-photos', 'Yes (read)', '5 MB', 'jpeg / png / webp / gif', 'Review photos. Stored under pending/<uuid>.jpg']],
  [2000, 1100, 1800, 2500, 1960]
));

// 12. API Endpoints
sections.push(h1('12. API Endpoints'));
sections.push(p('Located in /api/ and served as Vercel serverless functions.'));
sections.push(h3('POST /api/send-email'));
sections.push(p('Sends a Resend email to the owner when a customer books or requests a quote.'));
sections.push(bullet('Reads RESEND_API_KEY and NOTIFY_EMAIL from env vars.'));
sections.push(bullet('Sends from “Mobile Auto Repair <onboarding@resend.dev>” (Resend’s default verified sender).'));
sections.push(bullet('When bookingId + confirmToken provided, embeds a green Confirm Booking button.'));
sections.push(h3('GET /api/confirm-booking?id=...&token=...'));
sections.push(bullet('Called from the email by the owner.'));
sections.push(bullet('PATCH bookings SET status=‘confirmed’ — RLS policy ensures only pending rows with the matching token can be updated.'));
sections.push(bullet('Returns a styled HTML success page (or error page).'));
sections.push(h3('GET /api/ping'));
sections.push(bullet('Called every 5 days by cron-job.org to keep Supabase from auto-pausing.'));
sections.push(bullet('Returns { ok: true, ts: “ISO timestamp” }.'));

// 13. Email Flow
sections.push(h1('13. Email Flow'));
[
  'Customer submits booking',
  '   |',
  '   v',
  'Browser writes to bookings table (anon role)',
  '   |',
  '   v',
  'Browser fires POST /api/send-email',
  '   |     {type, name, phone, vehicle, details, bookingId, confirmToken}',
  '   v',
  'Vercel function calls Resend API',
  '   |',
  '   v',
  'Owner receives email at mobile-auto-repair@outlook.com:',
  '   Subject: New Appointment Request - Date Time - Name',
  '   Customer details + Confirm Booking button + Admin Panel link',
  '   |',
  '   v',
  'Owner clicks Confirm Booking',
  '   |',
  '   v',
  'GET /api/confirm-booking?id=...&token=...',
  '   |',
  '   v',
  'Supabase PATCH bookings SET status=confirmed',
  '   (RLS: anon_confirm_booking_by_token)',
  '   |',
  '   v',
  'Success HTML page rendered.',
].forEach(l => sections.push(code(l)));
sections.push(p('Important: Resend free-tier requires the to: address to exactly match the email registered with the Resend account. NOTIFY_EMAIL should match the Resend account email.'));

// 14. Customer Journey
sections.push(h1('14. Customer Journey'));
[
  'Prospect lands via Google search',
  '   |',
  '   v',
  'www.mobile-auto-repair.ca',
  '   |',
  '   +------------> Direct to /booking',
  '   +------------> Call 519-617-7214',
  '   |',
  '   v Estimator wizard /#estimator',
  '   |  Book Appointment CTA stores estimate to sessionStorage',
  '   v',
  '/booking 3-step wizard',
  '   Step 1: Service category',
  '   Step 2: Date + Time slot (calendar)',
  '   Step 3: Contact details',
  '   |',
  '   v',
  'Insert into bookings table; send notification email',
  '   |',
  '   v',
  'Customer sees success screen + scroll-to-top',
  '   |',
  '   v',
  'Owner calls customer to confirm by phone',
  '   |',
  '   v',
  'Customer arrives, work performed',
  '   |',
  '   v',
  'Owner asks for review -> /review',
  '   |',
  '   v',
  'Review submitted (status: pending)',
  '   |',
  '   v',
  'Admin approves -> shown in homepage Testimonials',
].forEach(l => sections.push(code(l)));

// 15. Admin Panel
sections.push(h1('15. Admin Panel'));
sections.push(p('URL: /admin (requires Supabase Auth login). Sections from top to bottom:'));
sections.push(bullet('Appointments table — filter Upcoming/All, status changes, Edit modal, sticky Actions column on mobile.'));
sections.push(bullet('Manage Availability — Week grid with 5×2-hour slots. Click slot → entry modal; click blocked → unblock; drag cards to reschedule; Block Day / Unblock Day toggle per column; small X on each card for one-tap removal.'));
sections.push(bullet('Analytics — Collapsed by default. Time-range filter, KPIs, daily trend, top pages, traffic sources, devices, busiest hours. Reset button (testing only).'));
sections.push(bullet('Customer Reviews — Pending / Approved / All filters. Approve / Hide / Mark Pending / Delete / Edit.'));
sections.push(bullet('Feature Toggles — localStorage-backed for instant overrides; Deploy button writes to features.js via local Node server at localhost:3001.'));
sections.push(bullet('Preview — Opens the homepage in a new tab.'));
sections.push(h3('Auto-refresh'));
sections.push(p('After any mutation (status change, edit, drag, etc.), appointments + availability are re-fetched from Supabase. The state hook refreshTick increments and forces both load effects to re-run.'));

// 16. Analytics & Tracking
sections.push(h1('16. Analytics & Tracking'));
sections.push(h3('Custom Supabase analytics (in admin)'));
sections.push(bullet('utils/trackPageView.js fires once per route mount from App.jsx.'));
sections.push(bullet('Skips /admin so the owner doesn’t pollute their own numbers.'));
sections.push(bullet('Stores anonymous data: path, referrer, classified source, user-agent, device, sessionStorage session ID (NOT a cookie), language, screen width.'));
sections.push(bullet('Admin dashboard aggregates client-side.'));
sections.push(bullet('Reset button wipes the table during testing.'));
sections.push(h3('Microsoft Clarity (external)'));
sections.push(bullet('Loaded via index.html script template %VITE_CLARITY_ID%.'));
sections.push(bullet('Only fires if VITE_CLARITY_ID env var is set in Vercel.'));
sections.push(bullet('Provides session recordings + heatmaps.'));
sections.push(bullet('Cookie banner has an opt-out.'));
sections.push(h3('Google Search Console (external)'));
sections.push(bullet('Ownership verified via DNS TXT record.'));
sections.push(bullet('Sitemap submitted at /sitemap.xml.'));
sections.push(bullet('Reports: search queries, impressions, click-through-rate, indexing coverage, Core Web Vitals.'));

// 17. SEO Setup
sections.push(h1('17. SEO Setup'));
sections.push(h3('Meta tags'));
sections.push(bullet('Per-page title, description, canonical URL via usePageMeta hook.'));
sections.push(bullet('OpenGraph + Twitter Card meta for social previews.'));
sections.push(bullet('og:image at /og-image.jpg (1200x630).'));
sections.push(h3('Structured data (JSON-LD)'));
sections.push(bullet('AutoRepair LocalBusiness schema in index.html with name, phone, address, hours, area served, aggregate rating, services with descriptions + priceRange.'));
sections.push(bullet('FAQPage schema injected dynamically by FAQ.jsx on mount, removed on unmount.'));
sections.push(h3('Crawling'));
sections.push(bullet('public/robots.txt allows all crawlers, disallows /admin and /api/.'));
sections.push(bullet('public/sitemap.xml lists all 8 public URLs with priority + changefreq.'));
sections.push(h3('Verification'));
sections.push(bullet('Google Search Console verified via DNS TXT.'));
sections.push(bullet('Backup verification via meta tag in index.html.'));

// 18. Feature Flags
sections.push(h1('18. Feature Flags'));
sections.push(p('Defined in src/config/features.js. Defaults are merged with localStorage[‘mar_features’] overrides.'));
sections.push(table(
  ['Flag', 'Default', 'Purpose'],
  [
    ['ESTIMATOR_SHOW_PRICE', 'false', 'Show preliminary CAD price range on Estimator result'],
    ['ESTIMATOR_ENABLED', 'true', 'Show/hide entire Estimator + navbar link'],
    ['SHOW_REVIEW_PHOTOS', 'true', 'Display photos in Testimonials'],
    ['STICKY_CALL_BUTTON', 'true', 'Show floating Call Now button on mobile'],
  ],
  [3000, 1200, 5160]
));
sections.push(p('Instantly (one browser only): Admin → Feature Toggles → flip switch → Save. Permanently (all visitors): Admin → Deploy Now (requires local Node admin server at localhost:3001).'));

// 19. Environment Variables
sections.push(h1('19. Environment Variables'));
sections.push(h3('Vercel (production)'));
sections.push(table(
  ['Variable', 'Value', 'Required?'],
  [
    ['RESEND_API_KEY', 'Provided by Resend dashboard', 'Yes (for email)'],
    ['NOTIFY_EMAIL', 'mobile-auto-repair@outlook.com', 'Yes (for email)'],
    ['VITE_CLARITY_ID', 'Provided by Clarity dashboard', 'No (Clarity only loads if set)'],
    ['VITE_SUPABASE_URL', 'https://udporjlwjwsmmouvflkk.supabase.co', 'No (hardcoded fallback)'],
    ['VITE_SUPABASE_ANON_KEY', 'Long JWT string', 'No (hardcoded fallback)'],
  ],
  [2800, 4200, 2360]
));

// 20. Deployment
sections.push(h1('20. Deployment Workflow'));
[
  'Developer edits code',
  '   |',
  '   v',
  'git commit && git push origin main',
  '   |',
  '   v',
  'GitHub webhook -> Vercel',
  '   |',
  '   v',
  'Vercel runs: npm install + vite build',
  '   |',
  '   v',
  'Built assets deployed to Vercel CDN',
  '   |',
  '   v',
  'Live in 30-60 seconds',
].forEach(l => sections.push(code(l)));
sections.push(p('Every push to main auto-deploys to production. Vercel auto-creates preview deployments for PRs (if used).'));

// 21. Known Limitations & Troubleshooting
sections.push(h1('21. Known Limitations & Troubleshooting'));
sections.push(h3('Supabase free-tier auto-pause'));
sections.push(p('After 7 days of inactivity, the project pauses. cron-job.org pings /api/ping every 5 days to prevent this.'));
sections.push(p('Symptom: “Couldn’t save” errors. Customer can’t book, admin can’t log in.'));
sections.push(p('Fix: Visit supabase.com/dashboard — the project auto-resumes in 1–2 minutes. Verify the cron-job is active.'));
sections.push(h3('Email not arriving'));
sections.push(bullet('RESEND_API_KEY not set / invalid in Vercel env vars.'));
sections.push(bullet('NOTIFY_EMAIL doesn’t exactly match the email registered with Resend (free tier).'));
sections.push(bullet('Email in spam folder.'));
sections.push(p('Debug: check Vercel function logs for [send-email] lines. Resend dashboard shows delivery logs.'));
sections.push(h3('Customer booking but admin doesn’t see it'));
sections.push(p('Cause: admin’s calendar data isn’t auto-refreshed when a customer books via the public site (only on admin-initiated actions).'));
sections.push(p('Workaround: refresh the admin page, or click any control (triggers refreshFromDb).'));
sections.push(p('Possible improvement: add Supabase Realtime subscription.'));
sections.push(h3('Image too large on mobile'));
sections.push(p('Service images in /public/assets/ are 500–900 KB PNGs. Slow on 3G.'));
sections.push(p('Improvement: convert to WebP, target 100–200 KB each.'));
sections.push(h3('No social-share preview image'));
sections.push(p('Symptom: sharing on WhatsApp/Facebook shows no thumbnail.'));
sections.push(p('Check: https://www.mobile-auto-repair.ca/og-image.jpg must return a real 1200x630 image. If it returns HTML, the SPA rewrite is intercepting it — fix is in vercel.json but verify the file is present in /public/.'));
sections.push(h3('Microsoft Clarity not tracking'));
sections.push(p('Check the homepage source for clarity.ms. If it still contains the placeholder %VITE_CLARITY_ID%, the env var isn’t set in Vercel. Fix: Vercel Settings → Environment Variables → add VITE_CLARITY_ID → Redeploy.'));
sections.push(h3('Hash navigation lands on wrong section'));
sections.push(p('Some sections are async-rendered. The Home component polls every 200 ms for up to 3 seconds to scroll once the element appears. If a section is still missing after that, check console for Supabase errors.'));

// 22. Future Improvements
sections.push(h1('22. Future Improvements'));
sections.push(p('Ordered roughly by impact-to-effort:'));
[
  'Google Business Profile — single highest-impact for local SEO.',
  'Convert PNG service images to WebP — ~70% smaller.',
  'Supabase Realtime — live updates in admin when customers book.',
  'Customer confirmation email — currently only owner gets one.',
  '24h appointment reminder — Vercel Cron + Resend, reduces no-shows.',
  'Post-service review request — auto-email after status=completed linking to /review.',
  'Brand identity / logo design — replace text logo with a mark + icon.',
  'WCAG 2.1 AA accessibility audit.',
  'French translation for Ontario audience.',
  'React Error Boundary at App level.',
  'Code-splitting (Estimator, Booking, Tuning as separate chunks).',
  'Move to Astro/Next.js for SSR + faster page load.',
].forEach(t => sections.push(bullet(t)));

// 23. Credentials map
sections.push(h1('23. Credentials & Access Map'));
sections.push(p('Confidential. Do not commit actual passwords or keys to git.'));
sections.push(table(
  ['Service', 'Login URL', 'Notes'],
  [
    ['GitHub', 'github.com/GamingTubeProg/mobile-auto-repair', 'Repository owner: GamingTubeProg'],
    ['Vercel', 'vercel.com', 'Project: mobile-auto-repair'],
    ['Supabase', 'supabase.com/dashboard', 'Project ID: udporjlwjwsmmouvflkk'],
    ['Resend', 'resend.com', 'Free tier; restricted to: mobile-auto-repair@outlook.com'],
    ['Spaceship', 'spaceship.com', 'DNS for mobile-auto-repair.ca'],
    ['Microsoft Clarity', 'clarity.microsoft.com', 'Project ID in Vercel env'],
    ['Google Search Console', 'search.google.com/search-console', 'Verified for mobile-auto-repair.ca'],
    ['cron-job.org', 'cron-job.org', 'Pings /api/ping every 5 days'],
  ],
  [2400, 3800, 3160]
));

// Appendix
sections.push(h1('Appendix A — File-by-file edit cheatsheet'));
sections.push(table(
  ['Task', 'File(s) to edit'],
  [
    ['Change phone number', 'Footer.jsx, StickyCallButton.jsx, index.html (Schema), api/send-email.js'],
    ['Change business email', 'Footer.jsx, Home.jsx, api/send-email.js (FALLBACK_TO), index.html'],
    ['Change working hours', 'index.html (Schema), Booking.jsx (TIME_SLOTS), Admin.jsx (ADM_TIME_SLOTS, RANGE_TO_SLOTS)'],
    ['Update minimum charge legal text', 'Terms.jsx, FAQ.jsx'],
    ['Add/edit a homepage service tile', 'Home.jsx (services array)'],
    ['Add a new public route', 'App.jsx (add if path === ‘/x’ ...), create page component, add to sitemap.xml'],
    ['Change Estimator categories', 'data/estimatorData.js'],
    ['Change Tuning vehicle list', 'data/tuningData.js'],
    ['Toggle a feature site-wide', 'Admin panel → Feature Toggles → Deploy Now (writes config/features.js)'],
  ],
  [3000, 6360]
));
sections.push(spacer());
sections.push(p([new TextRun({ text: 'End of document.', italics: true, color: '888888' })], { align: AlignmentType.CENTER }));

// ── document ───────────────────────────────────────────────────
const doc = new Document({
  creator: 'Claude',
  title: 'Mobile Auto Repair — Project Documentation',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Calibri', color: '1A1A1A' },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Calibri', color: 'E65C00' },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri', color: '333333' },
        paragraph: { spacing: { before: 220, after: 110 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Mobile Auto Repair — Project Documentation  —  Page ', size: 18, color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888' }),
            new TextRun({ text: ' of ', size: 18, color: '888888' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888' }),
          ],
        })],
      }),
    },
    children: [...cover, ...toc, ...sections],
  }],
});

const outPath = path.join(__dirname, 'PROJECT_DOCUMENTATION.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('Wrote', outPath, '(' + (buf.length / 1024).toFixed(1) + ' KB)');
});
