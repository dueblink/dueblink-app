import { pageMetadata } from '@/lib/seo';
import EmailTemplatesClient from './EmailTemplatesClient';
import { FAQS } from './faqs';

// Title leads with what people search for ("payment reminder email templates").
export const metadata = pageMetadata({
  title: "Payment Reminder Email Templates (Free) | DueBlink",
  description: "15 free payment reminder email templates with subject lines: friendly, firm and final notice, from before the due date to 2+ weeks overdue. Add your invoice details and send. No sign-up.",
  path: '/tools/payment-reminder-email-templates',
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
