import type { Metadata } from 'next';
import InterestCalculatorClient from './InterestCalculatorClient';
import { FAQS } from './faqs';

// Title leads with what people search for ("late payment interest calculator"),
// plus "MSME" because Indian freelancers and small businesses search for that rule.
export const metadata: Metadata = {
  title: 'Late Payment Interest Calculator (MSME 45-Day Rule) | DueBlink',
  description:
    'Calculate the interest a client owes on a late payment in India under the MSMED Act: 3× the RBI bank rate, compounded monthly, after 45 days. Or use your own contract rate. Free, no sign-up.',
  alternates: {
    canonical: 'https://www.dueblink.com/tools/late-payment-interest-calculator',
  },
  openGraph: {
    title: 'Late Payment Interest Calculator (MSME 45-Day Rule) | DueBlink',
    description:
      'Find out how much interest a client owes you on a late payment, under the MSME 45-day rule or your own contract rate. Free, no sign-up.',
    url: 'https://www.dueblink.com/tools/late-payment-interest-calculator',
    siteName: 'DueBlink',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Late Payment Interest Calculator (MSME 45-Day Rule) | DueBlink',
    description:
      'Find out how much interest a client owes you on a late payment. Free, no sign-up.',
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

export default function LatePaymentInterestCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <InterestCalculatorClient />
    </>
  );
}
