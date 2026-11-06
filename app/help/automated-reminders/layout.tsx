import { pageMetadata } from '@/lib/seo';

// This page's own Google title, description and address. Without this
// file it borrowed the /help settings, so Google could treat it as a
// copy of the main Help page.
export const metadata = pageMetadata({
  title: 'How Automatic Payment Reminders Work – DueBlink Help',
  description:
    'How DueBlink follows up for you: three reminders in one simple sequence, sent even when DueBlink is closed, and what happens when your client pays.',
  path: '/help/automated-reminders',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
