/**
 * Storefront banner fetcher — reads live promotional banners from the
 * Express/MongoDB backend's public endpoint (no auth). Returns only banners
 * the admin has marked active and in-schedule. No mock/dummy fallback: if the
 * API is unreachable the carousel simply doesn't render.
 */
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  bg_color: string;
  link_type: string;
  link_value: string | null;
  position: string;
  sort_order: number;
}

export async function getPublicBanners(position?: string): Promise<StoreBanner[]> {
  try {
    const url = `${API_BASE}/banners/public${position ? `?position=${encodeURIComponent(position)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    return (json?.data as StoreBanner[]) ?? [];
  } catch {
    return [];
  }
}
