import { publicToolRoutes } from '@/config/seoConfig';

export const generateSitemap = () => {
  const baseUrl = 'https://ashwheel.cloud';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/contact', priority: '0.8', changefreq: 'monthly' },
    { url: '/feedback', priority: '0.7', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { url: '/terms-conditions', priority: '0.5', changefreq: 'yearly' },
    { url: '/ashwheel-pro', priority: '0.9', changefreq: 'weekly' },
  ];
  
  const toolPages = publicToolRoutes
    .filter(route => !route.path.includes('/show') && route.path !== '/ashwheel-pro')
    .map(route => ({
      url: route.path,
      priority: '0.8',
      changefreq: 'weekly'
    }));
  
  const allPages = [...staticPages, ...toolPages];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
  
  allPages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });
  
  sitemap += `</urlset>`;
  
  return sitemap;
};

export const downloadSitemap = () => {
  const sitemap = generateSitemap();
  const blob = new Blob([sitemap], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
