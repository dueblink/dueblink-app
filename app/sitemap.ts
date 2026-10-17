import type { MetadataRoute } from 'next';

// The list of public pages Google should know about.
// Shows at https://www.dueblink.com/sitemap.xml
// When you add a new public page or free tool, add it here.

const SITE_URL = 'https://www.dueblink.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },

    // Free tools
    { path: '/tools/whatsapp-payment-reminder', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/payment-reminder-email-templates', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/late-payment-interest-calculator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/invoice-due-date-calculator', priority: 0.8, changeFrequency: 'monthly' },

    { path: '/help/automated-reminders', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/create-account', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  return pages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
