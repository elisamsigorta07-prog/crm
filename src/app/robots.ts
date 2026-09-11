import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://elisamsigorta07.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/crm/', '/crm/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
