import { pageMetadata } from '@/lib/seo';
import HindiReminderClient from './HindiReminderClient';
import { FAQS } from './faqs';

// Title leads with what people search for on Google
// ("payment reminder message in Hindi"), with DueBlink at the end.
export const metadata = pageMetadata({
  title: 'Payment Reminder Message in Hindi & Hinglish (Free) | DueBlink',
  description: '20 ready-to-send payment reminder messages in Hindi and Hinglish for WhatsApp, polite or firm, from before the due date to a final reminder. Free, no sign-up.',
  path: '/tools/payment-reminder-message-hindi',
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

export default function PaymentReminderHindiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <HindiReminderClient />
    </>
  );
}
