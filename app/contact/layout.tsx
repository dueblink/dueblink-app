import { pageMetadata } from '@/lib/seo';

// Google title, description and share image for this page.
export const metadata = pageMetadata({
  title: "Contact DueBlink",
  description: "Questions about DueBlink, payment reminders or your account? Get in touch with the DueBlink team.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
