import { LOCATIONS, type GeoLocation } from "./geo-locations";

export const ROUNDS_PER_GAME = 5;
export const MAX_SCORE_PER_ROUND = 5000;

export function toRad(d: number) {
  return (d * Math.PI) / 180;
}

// Haversine distance in km
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const a =
    s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// GeoGuessr-style exponential scoring
export function scoreForDistance(km: number): number {
  if (km <= 0.05) return MAX_SCORE_PER_ROUND;
  const score = MAX_SCORE_PER_ROUND * Math.exp(-km / 1500);
  return Math.max(0, Math.round(score));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export function pickRandomLocations(n: number, excludeIds: Set<string> = new Set()): GeoLocation[] {
  const pool = LOCATIONS.filter((l) => !excludeIds.has(l.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  if (shuffled.length >= n) return shuffled.slice(0, n);
  // pool exhausted (challenge reuse) — allow repeats
  const extra = [...LOCATIONS].sort(() => Math.random() - 0.5);
  return [...shuffled, ...extra].slice(0, n);
}

// Challenge links: /geo?c=id1,id2,id3 — same locations for you + stranger
export function encodeChallenge(locs: GeoLocation[]): string {
  return locs.map((l) => l.id).join(",");
}

export function decodeChallenge(param: string | null): GeoLocation[] | null {
  if (!param) return null;
  const ids = param.split(",").map((s) => s.trim()).filter(Boolean).slice(0, ROUNDS_PER_GAME);
  if (ids.length === 0) return null;
  const byId = new Map(LOCATIONS.map((l) => [l.id, l]));
  const locs = ids.map((id) => byId.get(id)).filter(Boolean) as GeoLocation[];
  return locs.length > 0 ? locs : null;
}

// Street View embed that works WITHOUT a Google API key.
// `heading` rotates the initial camera so "New angle" feels fresh.
export function streetViewEmbedUrl(lat: number, lng: number, heading = 0): string {
  return `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,${heading},0,0,5&output=svembed`;
}

export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}
