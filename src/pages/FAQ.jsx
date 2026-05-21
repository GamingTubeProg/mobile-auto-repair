import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageMeta from '../utils/usePageMeta';
import './FAQ.css';

/* Single flat list of customer FAQs. Each item is an object so we can also
   serialize them into Schema.org FAQPage JSON-LD for Google rich results. */
const FAQS = [
  {
    q: 'How much does a diagnosis cost?',
    a: `On-site diagnosis starts at a minimum charge of $80 CAD. This covers the technician's
        time and basic diagnostic equipment for the first portion of work. The minimum is
        included in — not added to — the final quote.`,
  },
  {
    q: 'What if I already know what needs to be done — can I skip the diagnosis?',
    a: `Yes. You can request a specific repair (for example: "replace the starter") and we'll
        proceed on your instruction. However, if it turns out that the replaced part wasn't
        actually the cause of the problem, the cost of the part and labour is on you. That's
        why we generally recommend at least a brief diagnosis first.`,
  },
  {
    q: 'Do you upsell or replace parts that don’t need replacing?',
    a: `No. We only replace what is actually defective. Unlike some shops that swap everything
        in the area "just in case", we diagnose first and target the real problem.`,
  },
  {
    q: 'Are you the cheapest option in London?',
    a: `No — and we don't try to be. We use quality parts, only replace what needs replacing,
        and stand behind our work. Quality has its price.`,
  },
  {
    q: 'Which payment methods do you accept?',
    a: `Cash, e-Transfer, and card. Payment is due upon completion of the work.`,
  },
  {
    q: 'What if the repair is too big to do on-site?',
    a: `For complex repairs we work with a partner workshop. Your car gets there one of three
        ways: drive it there yourself if it is road-ready, we can make it temporarily roadworthy
        so you can drive it, or it gets towed if undrivable.`,
  },
  {
    q: 'I started a repair myself and got stuck. Can you finish it?',
    a: `Usually yes — that is a common situation. We will assess what has been done and pick
        up from there. Note: if the DIY attempt caused additional damage (cross-threaded
        bolts, broken sensors, wrong wiring) the repair becomes more complex and the price
        reflects that. We always tell you honestly before starting.`,
  },
  {
    q: 'Which areas do you serve?',
    a: `Primary: London, Ontario and immediate surroundings. We also drive out to St. Thomas,
        Strathroy, and nearby towns. For locations further out, a small travel surcharge may
        apply — always disclosed before we leave.`,
  },
  {
    q: 'How fast can you come?',
    a: `Same-day service is often available. Submit a booking online or call 519-617-7214 —
        we'll confirm a slot by phone.`,
  },
  {
    q: 'Do you work weekends?',
    a: `Yes — Saturday full availability.`,
  },
  {
    q: 'Do I need to be home during the appointment?',
    a: `Yes — you (or someone you trust with your keys) needs to be present so we can access
        the vehicle, discuss findings, and approve any work before we start. Most jobs we can
        finish while you stay inside.`,
  },
  {
    q: 'Do you bring the parts, or do I need to source them?',
    a: `We bring everything. Common parts (brake pads, batteries, filters, sensors, fluids)
        we keep stocked. Less common parts specific to your year, make, and model we order
        before the appointment — we will let you know if there's a 1–2 day wait.`,
  },
  {
    q: 'Can you do pre-purchase inspections?',
    a: `Yes — we offer detailed pre-purchase inspections at the seller's location before you
        commit to buying a used car. See the Pre-Purchase Inspection page for the full
        60-point checklist.`,
  },
  {
    q: 'Do you work on European brands like BMW, Mercedes, Audi?',
    a: `Yes — European brands are a specialty. Trained in Germany, we work regularly with
        BMW, Mercedes-Benz, Audi, Volkswagen, and Porsche, including their specific diagnostic
        tools and quirks.`,
  },
  {
    q: 'What information do you need when I book?',
    a: `The basics: year, make, model, your vehicle's symptoms (or what you want done if
        known), and the location where the work will happen. Photos of warning lights or
        anything visibly broken help a lot — you can share them when we confirm by phone.`,
  },
];

export default function FAQ() {
  usePageMeta({
    title:       'FAQ — Mobile Auto Repair London, Ontario',
    description: 'Common questions about our mobile auto repair service in London, Ontario: pricing, $80 minimum charge, service area, payment methods, parts, European brands, weekend availability, and more.',
    path:        '/faq',
  });

  // Track which FAQs are open. Multiple can be open at once.
  const [open, setOpen] = useState(new Set());

  const toggle = (i) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  // Inject FAQPage JSON-LD so Google can show "People also ask" rich
  // results. Cleaned up on unmount so other pages aren't polluted.
  useEffect(() => {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          // Schema doesn't like newlines/extra whitespace — collapse to single spaces.
          text: item.a.replace(/\s+/g, ' ').trim(),
        },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.faqSchema = 'true';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="app">
      <Navbar />

      <section className="faq-hero">
        <div className="container faq-hero-inner">
          <span className="subtitle accent-line">Customer Questions</span>
          <h1 className="title">Frequently Asked <span className="title-accent">Questions.</span></h1>
          <p className="faq-hero-sub">
            Everything you typically want to know before booking — pricing, service area,
            what to expect on the day. If your question isn&apos;t here, just call us.
          </p>
        </div>
      </section>

      <section className="container faq-container">
        <ul className="faq-list">
          {FAQS.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <li key={i} className={`faq-item${isOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="faq-q"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{item.q}</span>
                  <ChevronDown className="faq-q-chevron" />
                </button>
                {isOpen && (
                  <div className="faq-a">
                    <p>{item.a}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="faq-still-questions">
          <h3>Still have a question?</h3>
          <p>
            We&apos;re happy to walk through anything before you book. Call{' '}
            <a href="tel:519-617-7214">519-617-7214</a> or{' '}
            <a href="mailto:mobile-auto-repair@outlook.com">email us</a>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
