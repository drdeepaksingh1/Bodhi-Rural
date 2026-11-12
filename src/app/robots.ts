import type { MetadataRoute } from 'next';

const siteUrl = 'https://bodhi-rural.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/auth/',
        '/login',
        '/reset-password',
        '/dashboard/',
        '/staff/',
        '/bodhifarm/',
        '/bodhimart/cart',
        '/bodhimart/checkout',
        '/bodhimart/admin/',
        '/bodhimart/seller/',
        '/db-test',
      ],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
