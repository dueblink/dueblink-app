import { pageMetadata } from '@/lib/seo';
import InterestCalculatorClient from './InterestCalculatorClient';
import { FAQS } from './faqs';

// Title leads with what people search for ("late payment interest calculator"),
// plus "MSME" because Indian freelancers and small businesses search for that rule.
export const metadata = pageMetadata({
  title: "MSME Late Payment Interest Calculator + Free Excel | DueBlink",
  description: "Calculate MSME late payment interest in India: 3× the RBI bank rate, compounded monthly, after 45 days. Use it online or download the free Excel calculator. No sign-up.",
  path: '/tools/late-payment-interest-calculator',
});

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
