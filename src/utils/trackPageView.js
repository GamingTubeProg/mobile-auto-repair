import { supabase } from '../lib/supabase';

const SESSION_KEY    = 'mar_session_id';
const ALREADY_TRACKED = new Set();  // pathname-per-mount dedupe inside one SPA session

/**
 * Classify document.referrer into a coarse "source" bucket so the
 * admin dashboard can show a quick pie of traffic origins.
 * - 'internal' — same-origin navigation (clicking around the site)
 * - 'direct'   — no referrer (typed URL, bookmark, app link)
 * - 'google'   — google.* search or google.com referer
 * - 'social'   — facebook/instagram/twitter/x/linkedin/reddit/tiktok/youtube
 * - 'other'    — anything else (other search engines, blogs, …)
 */
function classifyReferrer(ref, currentHost) {
  if (!ref) return 'direct';
  let host;
  try { host = new URL(ref).hostname.toLowerCase(); }
  catch { return 'other'; }
  if (host === currentHost) return 'internal';
  if (/(^|\.)google\./.test(host))     return 'google';
  if (/(^|\.)bing\./.test(host) ||
      /(^|\.)duckduckgo\./.test(host) ||
      /(^|\.)yahoo\./.test(host) ||
      /(^|\.)ecosia\./.test(host) ||
      /(^|\.)yandex\./.test(host))     return 'search';
  if (/(facebook|instagram|twitter|x\.com|linkedin|reddit|tiktok|youtube|pinterest)\./.test(host)) return 'social';
  return 'other';
}

/** Crude device class from user-agent string. */
function detectDevice(ua) {
  const s = (ua || '').toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s)) return 'tablet';
  if (/mobi|android|iphone|ipod|phone/.test(s)) return 'mobile';
  return 'desktop';
}

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch { /* fall through */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch { return uuid(); }
}

/**
 * Record one page view. Safe to call on every route mount — duplicate
 * pathnames in the same SPA session are ignored client-side.
 * Never throws, never blocks: fire-and-forget into Supabase.
 */
export function trackPageView(path) {
  // Don't track the admin pages — admin viewing their own dashboard
  // would pollute the stats.
  if (typeof window === 'undefined') return;
  if (path.startsWith('/admin')) return;

  // Dedupe per-session-per-path to avoid double-counting React StrictMode renders
  const key = path + '|' + (sessionStorage.getItem(SESSION_KEY) || '');
  if (ALREADY_TRACKED.has(key)) return;
  ALREADY_TRACKED.add(key);

  const ref = document.referrer || '';
  try {
    supabase.from('page_views').insert({
      path,
      referrer:   ref || null,
      source:     classifyReferrer(ref, window.location.hostname),
      user_agent: navigator.userAgent?.slice(0, 500) || null,
      device:     detectDevice(navigator.userAgent),
      session_id: getSessionId(),
      language:   navigator.language || null,
      screen_w:   Math.min(window.screen?.width || 0, 9999),
    }).then(() => {}, () => {}); // swallow errors silently
  } catch { /* ignore */ }
}
