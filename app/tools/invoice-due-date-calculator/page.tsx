import type { Metadata } from 'next';
import InvoiceDueDateCalculatorClient from './InvoiceDueDateCalculatorClient';
import { FAQS } from './faqs';

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
    canonical: 'https://www.dueblink.com/tools/invoice-due-date-calculator',
  },
  openGraph: {
    title: 'Invoice Due Date Calculator (Free) | DueBlink',
    description:
      'Calculate exactly when an invoice is due based on your payment terms. Instant, free, no sign-up required.',
    url: 'https://www.dueblink.com/tools/invoice-due-date-calculator',
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

// Lets Google show the questions and answers directly in search results.
const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function InvoiceDueDateCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <InvoiceDueDateCalculatorClient />
    </>
  );
}
