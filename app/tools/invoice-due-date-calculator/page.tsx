import type { Metadata } from 'next';
import InvoiceDueDateCalculatorClient from './InvoiceDueDateCalculatorClient';

// The page's actual <title> and meta description — this is what shows up
// in the browser tab and in Google search results, and it matters more for
// SEO than almost anything in the visible page content. It has to live
// here, in a server component, because 'use client' pages in Next.js
// can't export metadata directly.
//
// Naming choice: the title leads with the exact phrase people search for
// ("Invoice Due Date Calculator"), not a made-up branded name — nobody
// searches Google for a clever tool name they've never heard of. "DueBlink"
// is attached at the end for brand recognition once they're already
// looking at the result.
export const metadata: Metadata = {
  title: 'Invoice Due Date Calculator (Free) | DueBlink',
  description:
    'Calculate exactly when an invoice is due based on Net 7, 15, 30, 45, 60, or 90 day payment terms. Instant results, no sign-up required.',
  alternates: {
    canonical: 'https://dueblink.com/tools/invoice-due-date-calculator',
  },
  openGraph: {
    title: 'Invoice Due Date Calculator (Free) | DueBlink',
    description:
      'Calculate exactly when an invoice is due based on your payment terms. Instant, free, no sign-up required.',
    url: 'https://dueblink.com/tools/invoice-due-date-calculator',
    siteName: 'DueBlink',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Invoice Due Date Calculator (Free) | DueBlink',
    description:
      'Calculate exactly when an invoice is due based on your payment terms. Instant, free, no sign-up required.',
  },
};

export default function InvoiceDueDateCalculatorPage() {
  return <InvoiceDueDateCalculatorClient />;
}
