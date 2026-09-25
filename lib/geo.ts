// CliparsGEO engine.
// Scoring is the exact GeoGuessr/worldguessr formula (codergautam/worldguessr,
// components/calcPoints.js — PolyForm Noncommercial, used here noncommercially
// with attribution): pts = 5000 * e^(-10 * dist / maxDist).

import { SPOT_COUNTRIES } from "./geo-spots";

export const ROUNDS_PER_GAME = 5;
export const MAX_SCORE_PER_ROUND = 5000;
// worldguessr's maxDist: farthest meaningful guess distance on the map
export const WORLD_MAX_DIST_KM = 14916.862;

export type Spot = { lat: number; lng: number; country: string; code: string };

// Flat index — ORDER IS STABLE FOREVER (encoded in ?c= / ?s= links).
export const SPOTS: Spot[] = SPOT_COUNTRIES.flatMap((c) =>
  c.spots.map(([lat, lng]) => ({ lat, lng, country: c.name, code: c.code }))
);

export function toRad(d: number) {
  return (d * Math.PI) / 180;
}

// Haversine distance in km (same as worldguessr findDistance)
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Exact worldguessr calcPoints (no hint) — hint halves the points.
export function scoreForDistance(km: number, usedHint = false): number {
  if (km < 0.03) return MAX_SCORE_PER_ROUND;
  let pts = MAX_SCORE_PER_ROUND * Math.E ** ((-10 * km) / WORLD_MAX_DIST_KM);
  if (usedHint) pts = pts / 2;
  if (pts > 4997) pts = MAX_SCORE_PER_ROUND;
  return Math.max(0, Math.round(pts));
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Weighted-random country (worldguessr biases big countries + 2x western
// Europe via the weights in geo-spots.ts), then a random verified spot in it.
export function pickRandomSpots(n: number, excludeIdx: Set<number> = new Set()): number[] {
  const totalW = SPOT_COUNTRIES.reduce((s, c) => s + c.weight, 0);
  // country -> global start index
  const starts: number[] = [];
  let acc = 0;
  for (const c of SPOT_COUNTRIES) {
    starts.push(acc);
    acc += c.spots.length;
  }
  const out: number[] = [];
  const used = new Set(excludeIdx);
  let guard = 0;
  while (out.length < n && guard++ < n * 50) {
    let r = Math.random() * totalW;
    let ci = 0;
    for (; ci < SPOT_COUNTRIES.length; ci++) {
      r -= SPOT_COUNTRIES[ci].weight;
      if (r <= 0) break;
    }
    ci = Math.min(ci, SPOT_COUNTRIES.length - 1);
    const country = SPOT_COUNTRIES[ci];
    const si = Math.floor(Math.random() * country.spots.length);
    const gi = starts[ci] + si;
    if (used.has(gi)) continue;
    used.add(gi);
    out.push(gi);
  }
  // pool exhausted (shouldn't happen: 200+ spots) — allow repeats
  while (out.length < n) out.push(Math.floor(Math.random() * SPOTS.length));
  return out;
}

// Challenge/party seed links: /geo?c=12,45,7 — same spots for everyone.
export function encodeSeed(indexes: number[]): string {
  return indexes.join(",");
}

export function decodeSeed(param: string | null): number[] | null {
  if (!param) return null;
  const idx = param
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((v) => Number.isInteger(v) && v >= 0 && v < SPOTS.length)
    .slice(0, ROUNDS_PER_GAME);
  return idx.length > 0 ? idx : null;
}

// Street View embed that works WITHOUT a Google API key (same technique as
// worldguessr's free Embed API usage). `heading` rotates the initial camera.
export function streetViewEmbedUrl(lat: number, lng: number, heading = 0): string {
  return `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,${heading},0,0,5&output=svembed`;
}

export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// --- Country detection (streak mode + reveal labels) ----------------------
// Keyless reverse-geocode via BigDataCloud's free client API (no key, CORS ok).
const geoCache = new Map<string, { code: string; name: string }>();

export async function reverseCountry(lat: number, lng: number): Promise<{ code: string; name: string } | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.countryCode) return null;
    const out = { code: String(j.countryCode), name: String(j.countryName || j.countryCode) };
    geoCache.set(key, out);
    return out;
  } catch {
    return null;
  }
}

export function makePartyCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}
