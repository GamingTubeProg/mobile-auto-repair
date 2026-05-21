import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageMeta from '../utils/usePageMeta';
import './LegalPage.css';

const LAST_UPDATED = 'May 18, 2026';

export default function Privacy() {
  usePageMeta({
    title:       'Privacy Policy — Mobile Auto Repair',
    description: 'How Mobile Auto Repair collects, uses, and protects your personal information. PIPEDA-compliant policy covering bookings, reviews, third-party services and your data rights.',
    path:        '/privacy',
  });

  return (
    <div className="app">
      <Navbar />

      <section className="legal-hero">
        <div className="container legal-hero-inner">
          <span className="subtitle">Legal</span>
          <h1 className="title">Privacy <span className="title-accent">Policy</span></h1>
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <article className="container legal-article">
        <p className="legal-intro">
          Mobile Auto Repair (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website
          <strong> mobile-auto-repair.ca</strong>. This policy explains what personal
          information we collect, why we collect it, and how it&apos;s handled. We comply with
          Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA).
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following information only when you actively provide it:</p>
        <ul>
          <li><strong>Booking form:</strong> name, phone number, vehicle, problem description, preferred date and time</li>
          <li><strong>Review form:</strong> name (or initials), star rating, written comment, optional vehicle, optional photos</li>
          <li><strong>Quote / contact form:</strong> name, phone, optional vehicle, message text</li>
          <li><strong>Estimator wizard:</strong> vehicle year/make/model and selected problem details (used to build your estimate)</li>
        </ul>
        <p>
          We do <strong>not</strong> collect credit card, banking, or government ID information through this website.
          Payments are taken in person at the time of service.
        </p>

        <h2>2. Automatic Information</h2>
        <p>
          Our hosting provider (Vercel) records standard server logs — IP address, browser type,
          and pages visited — for security and uptime monitoring. We may also use privacy-friendly
          analytics tools (e.g. Microsoft Clarity) to understand how visitors navigate the site;
          these tools record anonymous interaction data and do not collect personally identifying
          information.
        </p>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To respond to your appointment request and confirm a service time</li>
          <li>To contact you about the work being done on your vehicle</li>
          <li>To publish approved reviews on the homepage</li>
          <li>To improve the website&apos;s usability and content</li>
        </ul>
        <p>
          We <strong>do not sell, rent, or trade</strong> your personal information to third
          parties. We do not send marketing emails unless you have explicitly asked us to.
        </p>

        <h2>4. Who We Share It With</h2>
        <p>
          Your data is stored with the following service providers, each of which acts on our
          behalf and is bound by their own privacy commitments:
        </p>
        <ul>
          <li><strong>Supabase</strong> (database + photo storage) — hosted in the United States</li>
          <li><strong>Vercel</strong> (website + serverless functions) — hosted globally</li>
          <li><strong>Resend</strong> (transactional email delivery)</li>
        </ul>

        <h2>5. How Long We Keep It</h2>
        <ul>
          <li><strong>Booking records:</strong> retained while the appointment is upcoming, then for up to 3 years for service-history purposes</li>
          <li><strong>Reviews:</strong> kept indefinitely once approved; removed any time on request</li>
          <li><strong>Uploaded photos:</strong> kept alongside the review they belong to</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>Under PIPEDA you have the right to:</p>
        <ul>
          <li>Ask what personal information we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Have your information deleted (subject to legal record-keeping requirements)</li>
          <li>Withdraw consent for our use of your information</li>
          <li>File a complaint with the Office of the Privacy Commissioner of Canada</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{' '}
          <a href="mailto:mobile-auto-repair@outlook.com">mobile-auto-repair@outlook.com</a>{' '}
          or call <a href="tel:519-617-7214">519-617-7214</a>.
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use a small number of cookies and similar technologies, all strictly for site
          functionality (e.g. remembering you&apos;re logged in as admin) and optional analytics.
          You can disable cookies in your browser at any time; the website will still work,
          although the admin panel will require you to sign in again on every visit.
        </p>

        <h2>8. Security</h2>
        <p>
          The website is served exclusively over HTTPS. The admin panel is protected by
          username + password authentication and Row-Level Security policies on the database.
          We follow reasonable industry-standard practices to protect data from unauthorized
          access, but no system can be 100% secure.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Significant changes will be highlighted
          at the top of this page along with the &quot;Last updated&quot; date.
        </p>

        <h2>10. Contact</h2>
        <p>
          Mobile Auto Repair<br />
          London, Ontario, Canada<br />
          Email: <a href="mailto:mobile-auto-repair@outlook.com">mobile-auto-repair@outlook.com</a><br />
          Phone: <a href="tel:519-617-7214">519-617-7214</a>
        </p>
      </article>

      <Footer />
    </div>
  );
}
