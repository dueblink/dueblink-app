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

export default function HomePage() {
  return <HomeClient />;
}
