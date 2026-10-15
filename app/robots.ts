import type { MetadataRoute } from 'next';

// Tells Google which pages to skip.
// Shows at https://www.dueblink.com/robots.txt

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/reset-password'],
      },
    ],
    sitemap: 'https://www.dueblink.com/sitemap.xml',
  };
}
