import { pageMetadata } from '@/lib/seo';

// Google title, description and share image for this page.
export const metadata = pageMetadata({
  title: "Pricing – DueBlink | Free and Pro Plans",
  description: "Simple pricing for DueBlink. Start free with AI payment reminders, or go Pro for automatic follow-ups, unlimited reminders and the Blink assistant. Monthly or yearly.",
  path: "/pricing",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
