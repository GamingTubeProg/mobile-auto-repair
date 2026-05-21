import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageMeta from '../utils/usePageMeta';
import './LegalPage.css';

const LAST_UPDATED = 'May 18, 2026';

export default function Terms() {
  usePageMeta({
    title:       'Terms of Service — Mobile Auto Repair',
    description: 'Terms governing Mobile Auto Repair’s mobile mechanic services in London, Ontario — appointment requests, pricing, $80 minimum charge, workmanship, warranty, and cancellation.',
    path:        '/terms',
  });

  return (
    <div className="app">
      <Navbar />

      <section className="legal-hero">
        <div className="container legal-hero-inner">
          <span className="subtitle">Legal</span>
          <h1 className="title">Terms of <span className="title-accent">Service</span></h1>
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <article className="container legal-article">
        <p className="legal-intro">
          By using this website or scheduling a service with Mobile Auto Repair, you agree to
          the following terms. If you do not agree, please do not use the site or our services.
        </p>

        <h2>1. About Us</h2>
        <p>
          Mobile Auto Repair is a mobile automotive repair business operating in London,
          Ontario and surrounding areas. We come to the customer&apos;s location to perform
          diagnostics, maintenance, and repair work on passenger vehicles.
        </p>

        <h2>2. Bookings &amp; Appointment Requests</h2>
        <p>
          Submitting a booking through this website is a <strong>request</strong>, not a
          guaranteed reservation. We confirm every appointment by phone before it&apos;s
          considered scheduled. We reserve the right to decline any request — for example,
          if the requested work is beyond what we can safely do on-site, if the location is
          outside our service area, or if our calendar is full.
        </p>

        <h2>3. Pricing &amp; Estimates</h2>
        <p>
          Any price range shown by our online Estimator is <strong>preliminary</strong>. It is
          based on typical labour and common parts for the described problem and may change
          after an on-site inspection. The final price is always confirmed with you before
          any work begins. You always approve the final quote before we start.
        </p>
        <p>
          We do not charge for arriving at your location to provide a quote within our standard
          service area. If a trip outside that area is required, any travel surcharge will be
          disclosed in advance.
        </p>
        <p>
          A <strong>minimum charge of $80 CAD</strong> applies to any service call where work
          is performed on-site. This covers the technician&apos;s time, basic diagnostic
          equipment, and travel within the standard service area. The minimum is included
          in — not added to — the final quote.
        </p>

        <h2>4. Payment</h2>
        <p>
          Payment is due in full upon completion of the work. We accept the payment methods
          posted at the time of booking. We do not store payment details on this website.
        </p>

        <h2>5. Workmanship Warranty</h2>
        <p>
          Repairs performed by us are covered by a labour warranty for a reasonable period
          appropriate to the type of work, communicated at the time of service. Parts are
          covered by the manufacturer&apos;s warranty (if any), not by us. The warranty is
          voided by tampering, neglect, abuse, accident, or work performed by a third party
          on the same repair afterward.
        </p>

        <h2>6. Limitations</h2>
        <p>
          We perform only the work explicitly agreed upon. We are not responsible for unrelated
          pre-existing conditions of the vehicle, or for issues that arise after the repair
          due to wear, prior damage, or work done by others.
        </p>
        <p>
          Our maximum liability for any claim related to a service we performed is limited to
          the amount you paid for that service. We are not liable for indirect, incidental, or
          consequential damages (e.g. towing costs, missed work, rental cars) except where
          required by law.
        </p>

        <h2>7. Customer Vehicle &amp; Property</h2>
        <p>
          The customer warrants that the vehicle being serviced is theirs (or that they have
          the legal right to authorize work on it) and that it is registered and insured as
          required by Ontario law. We are not responsible for items left in the vehicle.
        </p>

        <h2>8. Cancellation</h2>
        <p>
          You may cancel or reschedule any time by calling us. We appreciate as much notice
          as possible — typically at least a few hours before the booked slot — so we can
          offer the slot to another customer.
        </p>

        <h2>9. Reviews</h2>
        <p>
          By submitting a review through our website, you grant us a non-exclusive,
          royalty-free, worldwide licence to display it on the site and in marketing
          materials. We reserve the right to refuse to publish, edit lightly for clarity
          (without changing meaning), or remove any review at any time.
        </p>

        <h2>10. Intellectual Property</h2>
        <p>
          The website&apos;s design, text, and graphics are property of Mobile Auto Repair
          or its licensors. Brand logos shown on the homepage are the property of their
          respective owners and are used for identification purposes only — we are not
          affiliated with, endorsed by, or sponsored by any of those manufacturers.
        </p>

        <h2>11. Disclaimers</h2>
        <p>
          The website and our services are provided &quot;as is&quot;. We make no warranties
          about uninterrupted website availability or the accuracy of every piece of content.
          Information on this site is general guidance, not a substitute for a hands-on
          inspection by a qualified mechanic.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Province of Ontario and the federal
          laws of Canada applicable therein. Any dispute will be resolved in the courts of
          Ontario.
        </p>

        <h2>13. Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the site after a
          change constitutes acceptance of the updated terms.
        </p>

        <h2>14. Contact</h2>
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
