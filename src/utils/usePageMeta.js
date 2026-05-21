import { useEffect } from 'react';

/**
 * usePageMeta — set page-specific <title>, <meta description>, and
 * canonical URL when a route mounts. Cleans nothing up on unmount;
 * the next page's hook overwrites the same tags.
 *
 * For social-share previews (Open Graph / Twitter) the homepage values
 * in index.html stay in effect, because previews don't execute JS.
 * Per-page meta still helps Google search indexing of subpages.
 */
const SITE_URL = 'https://www.mobile-auto-repair.ca';
const DEFAULT_TITLE       = 'Mobile Auto Repair — On-Site Auto Mechanic in London, Ontario';
const DEFAULT_DESCRIPTION = 'Professional mobile auto repair in London, Ontario. We come to your driveway: diagnostics, engine, brakes, electrical, ECU tuning, batteries & maintenance. Same-day service. Call 519-617-7214.';

export default function usePageMeta({ title, description, path }) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;

    const desc = description || DEFAULT_DESCRIPTION;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // Open Graph title + description: also update so when someone shares
    // a deep link the preview at least reflects the right page.
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title || DEFAULT_TITLE);
    let ogDesc  = document.querySelector('meta[property="og:description"]');
    if (ogDesc)  ogDesc.setAttribute('content', desc);

    // Canonical URL — update if a `path` is provided, otherwise leave as is.
    if (path) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', SITE_URL + path);
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', SITE_URL + path);
    }
  }, [title, description, path]);
}
