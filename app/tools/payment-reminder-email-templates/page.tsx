import type { Metadata } from 'next';
import EmailTemplatesClient from './EmailTemplatesClient';
import { FAQS } from './faqs';

// Title leads with what people search for ("payment reminder email templates").
export const metadata: Metadata = {
  title: 'Payment Reminder Email Templates (Free) | DueBlink',
  description:
    '15 free payment reminder email templates with subject lines: friendly, firm and final notice, from before the due date to 2+ weeks overdue. Add your invoice details and send. No sign-up.',
  alternates: {
    canonical: 'https://www.dueblink.com/tools/payment-reminder-email-templates',
  },
  openGraph: {
    title: 'Payment Reminder Email Templates (Free) | DueBlink',
    description:
      'Friendly, firm and final payment reminder emails with subject lines. Add your invoice details and send. Free, no sign-up.',
    url: 'https://www.dueblink.com/tools/payment-reminder-email-templates',
    siteName: 'DueBlink',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Payment Reminder Email Templates (Free) | DueBlink',
    description:
      'Friendly, firm and final payment reminder emails with subject lines. Free, no sign-up.',
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

export default function PaymentReminderEmailTemplatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <EmailTemplatesClient />
    </>
  );
}
