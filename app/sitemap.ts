import { MetadataRoute } from 'next';
import { INITIAL_MOVIES, INITIAL_TV_SHOWS } from '@/lib/db/repository';
import { DEFAULT_GENRES } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://redxcinema.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/tv`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/language/hindi`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/language/english`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/dmca`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), priority: 0.4 },
  ];

  const movieRoutes: MetadataRoute.Sitemap = INITIAL_MOVIES.map((movie) => ({
    url: `${baseUrl}/movie/${movie.slug}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  const tvRoutes: MetadataRoute.Sitemap = INITIAL_TV_SHOWS.map((show) => ({
    url: `${baseUrl}/tv/${show.slug}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  const genreRoutes: MetadataRoute.Sitemap = DEFAULT_GENRES.map((genre) => ({
    url: `${baseUrl}/genre/${genre.slug}`,
    lastModified: new Date(),
    priority: 0.7,
  }));

  return [...staticRoutes, ...movieRoutes, ...tvRoutes, ...genreRoutes];
}
