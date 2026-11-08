import { marketById } from './types';

/** Enlace directo a la Biblioteca de Anuncios de Meta, ya filtrado por país y marca. */
export function adLibraryUrl(brandName: string, country = 'ALL'): string {
  const p = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country,
    q: brandName,
    search_type: 'keyword_unordered',
    media_type: 'all',
  });
  return `https://www.facebook.com/ads/library/?${p.toString()}`;
}

export function amazonSearchUrl(brandName: string, market: string): string {
  const domain = marketById(market)?.amazon ?? 'amazon.com';
  return `https://www.${domain}/s?k=${encodeURIComponent(brandName)}`;
}

export function similarWebUrl(domain: string): string {
  return `https://www.similarweb.com/website/${domain}/`;
}

export function hostOf(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
  }
}

export function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const u = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    new URL(u);
    return u;
  } catch {
    return undefined;
  }
}
