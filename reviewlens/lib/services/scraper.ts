import axios from 'axios';
import type { App, Review, Platform } from '@/types';

interface AppMetadata {
  name: string;
  developer: string;
  icon_url: string;
  category: string;
  current_rating: number;
  rating_count: number;
  current_version: string;
  description: string;
}

export function parseAppStoreUrl(url: string): { platform: Platform; appId: string; country: string } {
  const urlObj = new URL(url);

  if (urlObj.hostname.includes('apps.apple.com')) {
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const country = pathParts[0] || 'us';
    const idPart = pathParts.find((part) => part.startsWith('id'));

    if (!idPart) {
      throw new Error('Invalid App Store URL: missing app ID');
    }

    const appId = idPart.replace('id', '');

    return { platform: 'ios', appId, country };
  }

  if (urlObj.hostname.includes('play.google.com')) {
    const appId = urlObj.searchParams.get('id');
    if (!appId) {
      throw new Error('Invalid Google Play URL: missing app ID');
    }

    return { platform: 'android', appId, country: 'us' };
  }

  throw new Error('Unsupported app store URL');
}

export async function fetchAppMetadata(
  platform: Platform,
  appId: string,
  country: string = 'us'
): Promise<AppMetadata> {
  if (platform === 'ios') {
    const response = await axios.get(
      `https://itunes.apple.com/lookup?id=${appId}&country=${country}`
    );

    const data = response.data;
    if (data.resultCount === 0) {
      throw new Error('App not found');
    }

    const result = data.results[0];

    return {
      name: result.trackName,
      developer: result.artistName,
      icon_url: result.artworkUrl512 || result.artworkUrl100,
      category: result.primaryGenreName,
      current_rating: result.averageUserRating,
      rating_count: result.userRatingCount,
      current_version: result.version,
      description: result.description || '',
    };
  }

  if (platform === 'android') {
    throw new Error('Google Play scraping not yet implemented');
  }

  throw new Error('Unsupported platform');
}

interface RawReview {
  title: string;
  content: string;
  rating: number;
  author: string;
  date: string;
  version: string;
  helpful_count: number;
  review_id?: string;
}

export async function fetchAppStoreReviews(
  appId: string,
  country: string = 'us',
  maxPages: number = 10
): Promise<RawReview[]> {
  const allReviews: RawReview[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostRecent/json`;
      const response = await axios.get(url, { timeout: 15000 });

      const feed = response.data?.feed;
      if (!feed) break;

      const entries = feed.entry || [];
      if (entries.length === 0) break;

      for (const entry of entries) {
        if (!entry['im:rating']) continue;

        allReviews.push({
          title: entry.title?.label || '',
          content: entry.content?.label || '',
          rating: parseInt(entry['im:rating']?.label || '0', 10),
          author: entry.author?.name?.label || 'Anonymous',
          date: entry.updated?.label || new Date().toISOString(),
          version: entry['im:version']?.label || '',
          helpful_count: parseInt(entry['im:voteCount']?.label || '0', 10),
          review_id: entry.id?.label,
        });
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }

  return allReviews;
}

export async function fetchGooglePlayReviews(
  appId: string,
  maxResults: number = 100
): Promise<RawReview[]> {
  throw new Error('Google Play scraping not yet implemented');
}

export async function scrapeApp(appUrl: string, maxPages: number = 10) {
  const { platform, appId, country } = parseAppStoreUrl(appUrl);

  const metadata = await fetchAppMetadata(platform, appId, country);

  let reviews: RawReview[] = [];
  if (platform === 'ios') {
    reviews = await fetchAppStoreReviews(appId, country, maxPages);
  } else if (platform === 'android') {
    reviews = await fetchGooglePlayReviews(appId, maxPages * 10);
  }

  return {
    platform,
    appId,
    country,
    metadata,
    reviews,
  };
}
