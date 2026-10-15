// Payment reminder email templates, written by hand (no AI).
// Every template reads correctly whether or not the optional
// details (amount, invoice number, due date, names) are filled in.

export type Tone = 'friendly' | 'firm' | 'final';

export type EmailValues = {
  greeting: string;   // "Hi Rahul," or "Hi,"
  payment: string;    // "the payment of ₹25,000 for the website design" or "the payment for my latest invoice"
  ref: string;        // " (invoice INV-102)" or ""
  refSubject: string; // " – Invoice INV-102" or ""
  dueOn: string;      // "20 October" or ""
  sender: string;     // "Priya" or ""
};

export type EmailTemplate = {
  tone: Tone;
  subject: (v: EmailValues) => string;
  body: (v: EmailValues) => string;
};

export const sign = (v: EmailValues, word: string) => (v.sender ? `${word},\n${v.sender}` : `${word},`);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const STAGES: { id: string; label: string; short: string; templates: EmailTemplate[] }[] = [
  {
    id: 'before',
    label: 'Before the due date',
    short: 'Due soon',
    templates: [
      {
        tone: 'friendly',
        subject: (v) => `Friendly reminder: payment due ${v.dueOn ? `on ${v.dueOn}` : 'soon'}${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI hope you're doing well. This is a friendly reminder that ${v.payment}${v.ref} is due ${v.dueOn ? `on ${v.dueOn}` : 'in a few days'}.\n\nIf you need the invoice again or any details from my side, just reply to this email.\n\n${sign(v, 'Thanks')}`,
      },
      {
        tone: 'friendly',
        subject: (v) => `Upcoming payment${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nA quick note to keep this on your radar: ${v.payment}${v.ref} is coming up ${v.dueOn ? `on ${v.dueOn}` : 'this week'}.\n\nThank you for your business. It's been great working with you.\n\n${sign(v, 'Best regards')}`,
      },
      {
        tone: 'firm',
        subject: (v) => `Payment due ${v.dueOn ? `on ${v.dueOn}` : 'in 2 days'}${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nThis is a reminder that ${v.payment}${v.ref} is due ${v.dueOn ? `on ${v.dueOn}` : 'in 2 days'}, as per the agreed payment terms.\n\nPlease make sure the payment is scheduled so it reaches me on time.\n\n${sign(v, 'Regards')}`,
      },
    ],
  },
  {
    id: 'today',
    label: 'On the due date',
    short: 'Due today',
    templates: [
      {
        tone: 'friendly',
        subject: (v) => `Payment due today${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI hope all is well. Just a reminder that ${v.payment}${v.ref} is due today.\n\nIf you've already sent it, please ignore this email, and thank you! If not, I'd be grateful if you could process it when you get a moment.\n\n${sign(v, 'Thanks')}`,
      },
      {
        tone: 'friendly',
        subject: (v) => `Quick reminder: payment due today${v.refSubject}`,
        body: (v) => `${v.greeting}\n\n${capitalize(v.payment)}${v.ref} is due today. Could you please let me know once it has been sent, so I can update my records?\n\nThank you, and have a great day.\n\n${sign(v, 'Best')}`,
      },
      {
        tone: 'firm',
        subject: (v) => `Payment due today${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nThis is a reminder that ${v.payment}${v.ref} is due today.\n\nPlease process the payment today and share the transaction reference once it's done.\n\n${sign(v, 'Regards')}`,
      },
    ],
  },
  {
    id: 'late3',
    label: 'A few days late',
    short: '3 days late',
    templates: [
      {
        tone: 'friendly',
        subject: (v) => `Following up on payment${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI'm just following up on ${v.payment}${v.ref}, which was due ${v.dueOn ? `on ${v.dueOn}` : 'a few days ago'}. I haven't received it yet, so I wanted to check in.\n\nCould you let me know when I can expect it? If there's anything you need from me, I'm happy to help.\n\n${sign(v, 'Thanks')}`,
      },
      {
        tone: 'friendly',
        subject: (v) => `Checking in on payment${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI hope everything is going well. I think ${v.payment}${v.ref} may have slipped through the cracks, as it was due ${v.dueOn ? `on ${v.dueOn}` : 'a few days ago'}.\n\nCould you please take a look and let me know the payment date?\n\n${sign(v, 'Many thanks')}`,
      },
      {
        tone: 'firm',
        subject: (v) => `Overdue payment${v.refSubject}`,
        body: (v) => `${v.greeting}\n\n${capitalize(v.payment)}${v.ref} is now overdue. It was due ${v.dueOn ? `on ${v.dueOn}` : 'a few days ago'}.\n\nPlease arrange the payment at the earliest and share the confirmation once it's done.\n\n${sign(v, 'Regards')}`,
      },
    ],
  },
  {
    id: 'late7',
    label: 'One week late',
    short: '1 week late',
    templates: [
      {
        tone: 'friendly',
        subject: (v) => `Second reminder: payment overdue${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI'm following up again on ${v.payment}${v.ref}, which is now a week overdue${v.dueOn ? ` (it was due on ${v.dueOn})` : ''}.\n\nIs anything holding it up on your side? If it helps, I can resend the invoice or my bank details. Please let me know a date when I can expect the payment.\n\n${sign(v, 'Thanks')}`,
      },
      {
        tone: 'firm',
        subject: (v) => `Payment 1 week overdue${v.refSubject}`,
        body: (v) => `${v.greeting}\n\n${capitalize(v.payment)}${v.ref} is now 7 days past due, and I haven't received a response to my earlier reminder.\n\nPlease confirm by reply when the payment will be made.\n\n${sign(v, 'Regards')}`,
      },
      {
        tone: 'firm',
        subject: (v) => `Action needed: overdue payment${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI'm writing about ${v.payment}${v.ref}, which is now a week overdue.\n\nTo keep things running smoothly on both sides, please clear the payment by the end of this week, or let me know if there's an issue we need to discuss.\n\n${sign(v, 'Regards')}`,
      },
    ],
  },
  {
    id: 'final',
    label: 'Final notice (2+ weeks late)',
    short: 'Final notice',
    templates: [
      {
        tone: 'firm',
        subject: (v) => `Urgent: payment over 2 weeks overdue${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nDespite my earlier reminders, ${v.payment}${v.ref} is now more than 2 weeks overdue.\n\nPlease make the payment within the next 3 working days. If there's a reason for the delay, please let me know so we can find a solution.\n\n${sign(v, 'Regards')}`,
      },
      {
        tone: 'final',
        subject: (v) => `Final notice: overdue payment${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nThis is my final reminder about ${v.payment}${v.ref}, which remains unpaid well past the due date.\n\nPlease clear the full amount within 3 working days. If I don't receive it by then, I'll have to pause any further work and apply late fees as per our terms.\n\n${sign(v, 'Regards')}`,
      },
      {
        tone: 'final',
        subject: (v) => `Final reminder before further action${v.refSubject}`,
        body: (v) => `${v.greeting}\n\nI have contacted you several times about ${v.payment}${v.ref}, and it is still outstanding.\n\nPlease treat this as a final reminder. If the payment isn't received within 7 days, I'll need to consider formal recovery options. I would much prefer to resolve this directly with you, so please reply to let me know your plan.\n\n${sign(v, 'Regards')}`,
      },
    ],
  },
];
