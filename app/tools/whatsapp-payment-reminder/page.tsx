import type { Metadata } from 'next';
import WhatsAppReminderClient from './WhatsAppReminderClient';
import { FAQS } from './faqs';

// Title leads with what people actually search for on Google
// ("WhatsApp payment reminder message"), with DueBlink at the end.
export const metadata: Metadata = {
  title: 'WhatsApp Payment Reminder Messages (Free Templates) | DueBlink',
  description:
    '15 ready-to-send WhatsApp messages to remind a client about payment, polite or firm, from before the due date to a final reminder. Add your details and send in one tap. Free, no sign-up.',
  alternates: {
    canonical: 'https://www.dueblink.com/tools/whatsapp-payment-reminder',
  },
  openGraph: {
    title: 'WhatsApp Payment Reminder Messages (Free Templates) | DueBlink',
    description:
      'Ready-to-send WhatsApp messages to remind a client about payment, politely or firmly. Free, no sign-up.',
    url: 'https://www.dueblink.com/tools/whatsapp-payment-reminder',
    siteName: 'DueBlink',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'WhatsApp Payment Reminder Messages (Free Templates) | DueBlink',
    description:
      'Ready-to-send WhatsApp messages to remind a client about payment, politely or firmly. Free, no sign-up.',
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

export default function WhatsAppPaymentReminderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <WhatsAppReminderClient />
    </>
  );
}
