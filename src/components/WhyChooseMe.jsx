import { useState, useEffect, useCallback } from 'react';
import './WhyChooseMe.css';

const SECTIONS = [
  {
    heading: 'About Me',
    body: 'I am a licensed automotive technician with extensive hands-on experience gained through working in multiple workshops and real-world diagnostic environments.',
  },
  {
    heading: 'Core Problem Observed in Workshops',
    intro: 'From my professional experience, I have frequently seen:',
    items: [
      'Customers being recommended unnecessary repairs or parts',
      'Decisions made without proper diagnostic depth',
      'High repair costs without solving the actual issue',
    ],
  },
  {
    heading: 'Real-World Experience',
    intro: 'A large portion of my work involves vehicles that:',
    items: [
      'Have been in workshops for weeks or months without resolution',
      'Underwent multiple repair attempts without fixing the root cause',
      'Often suffer from complex electrical or no-start issues',
    ],
  },
  {
    heading: 'My Approach',
    intro: 'My work is based on a simple principle:',
    items: [
      'Structured and precise diagnostics first',
      'Repairs only when truly necessary',
      'Focus on root cause instead of symptoms',
    ],
  },
  {
    heading: 'Pricing & Value',
    body: 'I am not positioned as the cheapest option. The focus is on correct diagnosis and repair from the start — avoiding unnecessary costs from trial-and-error repairs and delivering long-term reliable solutions.',
  },
];

export default function WhyChooseMe() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

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
        <div
          className="wcm-overlay"
          onPointerDown={close}
          role="dialog"
          aria-modal="true"
          aria-label="Why Choose Me"
        >
          <div className="wcm-modal" onPointerDown={e => e.stopPropagation()}>

            {/* Drag handle (mobile) */}
            <div className="wcm-handle" aria-hidden="true" />

            <div className="wcm-header">
              <h2 className="wcm-title">Why Choose Me</h2>
              <button className="wcm-close" onClick={close} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
                      {s.items.map((item, j) => <li key={j}>{item}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Visible close button at bottom — critical for mobile usability */}
            <div className="wcm-bottom-close">
              <button className="wcm-bottom-btn" onClick={close}>Close</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
