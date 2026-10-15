// Questions and answers for the late payment interest calculator page.
// Used on the page itself and in the Google FAQ data (page.tsx).

import { RBI_BANK_RATE, RBI_BANK_RATE_AS_OF } from './interest';

export const FAQS = [
  {
    q: 'What is the MSME 45-day payment rule?',
    a: 'Under the MSMED Act, 2006, a buyer must pay a micro or small enterprise by the date agreed in writing, and that date can’t be more than 45 days after the goods or services were accepted. If there’s no written agreement, payment is due within 15 days.',
  },
  {
    q: 'How much interest can an MSME charge on late payments?',
    a: `If the buyer pays late, they owe compound interest with monthly rests at three times the bank rate notified by the RBI. With the RBI Bank Rate at ${RBI_BANK_RATE}% (as of ${RBI_BANK_RATE_AS_OF}), that works out to ${(RBI_BANK_RATE * 3).toFixed(2)}% per year, compounded monthly.`,
  },
  {
    q: 'Who can claim interest under the MSMED Act?',
    a: 'Suppliers registered as micro or small enterprises under Udyam, for goods or services supplied to a buyer. Medium enterprises are not covered by these delayed-payment rules. The interest is payable by law, even if your invoice doesn’t mention it.',
  },
  {
    q: 'What can I do if a client still doesn’t pay?',
    a: 'Start with polite reminders that mention the amount and the MSMED Act. If that doesn’t work, micro and small enterprises can file a delayed-payment complaint on the government’s MSME Samadhaan portal, which refers the case to the MSE Facilitation Council for conciliation or arbitration.',
  },
  {
    q: 'Is this calculation legally exact?',
    a: 'It’s a close estimate to help you know where you stand. The exact figure can depend on the acceptance date, the bank rate in force during the delay and how months are counted. For a formal claim, check the figures with your chartered accountant or legal advisor.',
  },
];
