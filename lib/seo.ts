import type { Metadata } from 'next';

// One place to build each page's Google title, description,
// web address and share image (WhatsApp, X, LinkedIn previews).

export const SITE_URL = 'https://www.dueblink.com';
const SHARE_IMAGE = '/og-image.png';

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;        // e.g. '/pricing'
  noIndex?: boolean;   // true = keep this page out of Google
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: `${SITE_URL}${opts.path}` },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: `${SITE_URL}${opts.path}`,
      siteName: 'DueBlink',
      type: 'website',
      locale: 'en_IN',
      images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: 'DueBlink' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [SHARE_IMAGE],
    },
    ...(opts.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
