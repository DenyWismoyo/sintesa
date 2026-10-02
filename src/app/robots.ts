import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/pelatihan/builder',
          '/pos/',
          '/tenant/',
          '/lms/dashboard',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
