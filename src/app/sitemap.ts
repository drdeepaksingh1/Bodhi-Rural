import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.brlps.co.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '/', priority: 1, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/projects', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/farmer-network', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'yearly' as const },
  ];

  return pages.map((page) => ({
    url: new URL(page.path, siteUrl).toString(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
