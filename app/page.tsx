import { pageMetadata } from '@/lib/seo';
import HomeClient from './HomeClient';

// Home page: Google title, description and the canonical address
// (https://www.dueblink.com/), so Google treats every version of the
// home page as one page. The page itself lives in HomeClient.tsx.
export const metadata = pageMetadata({
  title: 'Free Payment Reminder Generator for WhatsApp & Email | DueBlink',
  description:
    "Client hasn't paid? Get a polite payment reminder for WhatsApp or email in seconds. Free, no sign-up. Made for freelancers and small businesses in India.",
  path: '/',
});

// ==================================================
// SCHEMA MARKUP — tells Google, Bing and AI tools (ChatGPT, Copilot,
// Gemini) exactly what DueBlink is, who makes it and what it costs.
// Visitors never see this; only search engines read it.
// Only real facts here (no ratings or user counts).
// If prices change, update the numbers in "offers" below.
// ==================================================
const SITE_URL = 'https://www.dueblink.com';

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'DueBlink',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.png`,
      email: 'support@dueblink.com',
      areaServed: 'IN',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@dueblink.com',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'DueBlink',
      url: `${SITE_URL}/`,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'DueBlink',
      url: `${SITE_URL}/`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      description:
        'DueBlink writes polite payment reminders for WhatsApp and email in seconds, tracks which clients still owe you, and sends automatic follow-ups on the due date, 3 days after and 7 days after. Made for freelancers and small businesses in India.',
      featureList: [
        'AI payment reminder generator for WhatsApp and email',
        'Hindi and Hinglish payment reminder templates',
        'Client and due date tracking dashboard',
        'Automatic email follow-ups (due date, +3 days, +7 days)',
        'MSME late payment interest calculator',
      ],
      publisher: { '@id': `${SITE_URL}/#organization` },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'INR',
          url: `${SITE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Pro Monthly',
          price: '299',
          priceCurrency: 'INR',
          url: `${SITE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Pro Yearly',
          price: '2499',
          priceCurrency: 'INR',
          url: `${SITE_URL}/pricing`,
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <HomeClient />
    </>
  );
}
