import { useState, useEffect, useCallback } from 'react';
import './WhyChooseMe.css';

const SECTIONS = [
  {
    heading: 'About Me',
    body: 'I am a licensed automotive technician with extensive hands-on experience gained through working in multiple workshops and real-world diagnostic environments.',
  },
  {
    heading: 'Core Problem Observed in Workshops',
    items: [
      'Customers being recommended unnecessary repairs or parts',
      'Decisions made without proper diagnostic depth',
      'High repair costs without solving the actual issue',
    ],
    intro: 'From my professional experience, I have frequently seen:',
  },
  {
    heading: 'Real-World Experience',
    items: [
      'Vehicles that have been in workshops for weeks or months without resolution',
      'Multiple repair attempts without fixing the root cause',
      'Complex electrical or no-start issues often left unresolved',
    ],
    intro: 'A large portion of my work involves vehicles that:',
  },
  {
    heading: 'My Approach',
    items: [
      'Structured and precise diagnostics first',
      'Repairs only when truly necessary',
      'Focus on root cause instead of symptoms',
    ],
    intro: 'My work is based on a simple principle:',
  },
  {
    heading: 'Pricing & Value',
    body: 'I am not positioned as the cheapest option. The focus is on correct diagnosis and repair from the start — avoiding unnecessary costs from trial-and-error repairs and delivering long-term reliable solutions.',
  },
];

export default function WhyChooseMe() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button className="wcm-trigger" onClick={() => setOpen(true)}>
        Why Choose Me
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="wcm-overlay" onClick={close} role="dialog" aria-modal="true" aria-label="Why Choose Me">
          <div className="wcm-modal" onClick={e => e.stopPropagation()}>

            <div className="wcm-header">
              <h2 className="wcm-title">Why Choose Me</h2>
              <button className="wcm-close" onClick={close} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="wcm-body">
              {SECTIONS.map((s, i) => (
                <div key={i} className="wcm-section">
                  <h3 className="wcm-section-heading">{s.heading}</h3>
                  {s.intro && <p className="wcm-intro">{s.intro}</p>}
                  {s.body  && <p className="wcm-text">{s.body}</p>}
                  {s.items && (
                    <ul className="wcm-list">
                      {s.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="wcm-footer">
              <a href="#contact" className="btn btn-primary" onClick={close}>
                Book a Diagnostic
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
