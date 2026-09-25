"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ROUNDS_PER_GAME,
  MAX_SCORE_PER_ROUND,
  decodeChallenge,
  encodeChallenge,
  formatDistance,
  googleMapsLink,
  haversineKm,
  pickRandomLocations,
  scoreForDistance,
  streetViewEmbedUrl,
} from "@/lib/geo";
import type { GeoLocation } from "@/lib/geo-locations";

type Phase = "menu" | "playing" | "reveal" | "finished";
type Guess = { lat: number; lng: number };
type RoundResult = { loc: GeoLocation; guess: Guess | null; distanceKm: number; score: number };

// ---- Leaflet via CDN (no npm dep, no API key needed) ----
function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if ((loadLeaflet as any)._p) return (loadLeaflet as any)._p;
  (loadLeaflet as any)._p = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet-css", "1");
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("Failed to load map library"));
    document.head.appendChild(script);
  });
  return (loadLeaflet as any)._p;
}

function GuessMap({
  guess,
  reveal,
  onGuess,
}: {
  guess: Guess | null;
  reveal: GeoLocation | null;
  onGuess: (g: Guess) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const onGuessRef = useRef(onGuess);
  onGuessRef.current = onGuess;
  const [mapError, setMapError] = useState(false);

  // init once
  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    loadLeaflet()
      .then((L: any) => {
        if (cancelled || !divRef.current || mapRef.current) return;
        map = L.map(divRef.current, {
          worldCopyJump: true,
          minZoom: 2,
          maxZoom: 18,
          zoomControl: true,
        }).setView([20, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        map.on("click", (e: any) => onGuessRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch(() => setMapError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // redraw markers on state change
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L || !layerRef.current) return;
    layerRef.current.clearLayers();
    if (guess) {
      L.circleMarker([guess.lat, guess.lng], {
        radius: 8, color: "#ff3b30", weight: 3, fillColor: "#ff3b30", fillOpacity: 0.9,
      })
        .bindTooltip("Your guess")
        .addTo(layerRef.current);
    }
    if (reveal) {
      L.circleMarker([reveal.lat, reveal.lng], {
        radius: 8, color: "#22c55e", weight: 3, fillColor: "#22c55e", fillOpacity: 0.9,
      })
        .bindTooltip(`${reveal.name}, ${reveal.country}`)
        .addTo(layerRef.current);
      if (guess) {
        L.polyline(
          [
            [guess.lat, guess.lng],
            [reveal.lat, reveal.lng],
          ],
          { color: "#fff", weight: 2, dashArray: "6 6" }
        ).addTo(layerRef.current);
        map.flyToBounds(
          L.latLngBounds([guess.lat, guess.lng], [reveal.lat, reveal.lng]).pad(0.4),
          { duration: 1 }
        );
      } else {
        map.flyTo([reveal.lat, reveal.lng], 4, { duration: 1 });
      }
    } else if (guess) {
      map.flyTo([guess.lat, guess.lng], Math.max(map.getZoom(), 3), { duration: 0.6 });
    }
  }, [guess, reveal]);

  if (mapError) {
    return (
      <div className="grid h-[380px] place-items-center rounded-2xl border border-[#232333] bg-[#0a0a0f] p-6 text-center text-sm text-zinc-400">
        <p>
          Map failed to load (CDN blocked?). You can still play: type your guess as lat,lng below.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#232333]">
      <div ref={divRef} className="h-[380px] w-full bg-[#0a0a0f]" />
      <p className="border-t border-[#232333] bg-[#14141c] px-4 py-2 text-xs text-zinc-500">
        Click the map to drop your pin · drag to pan · scroll to zoom · © OpenStreetMap
      </p>
    </div>
  );
}

function grade(total: number): string {
  const pct = total / (ROUNDS_PER_GAME * MAX_SCORE_PER_ROUND);
  if (pct >= 0.9) return "Legendary explorer 🏆";
  if (pct >= 0.7) return "Sharp detective 🕵️";
  if (pct >= 0.45) return "Solid traveller ✈️";
  if (pct >= 0.25) return "Wandering rookie 🧭";
  return "Lost tourist 😅 — run it back!";
}

function GameInner() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("menu");
  const [locs, setLocs] = useState<GeoLocation[]>([]);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [heading, setHeading] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [best, setBest] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isChallenge, setIsChallenge] = useState(false);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("clipars_geo_best") || 0));
    } catch {}
  }, []);

  const start = useCallback(
    (fixed?: GeoLocation[]) => {
      const chosen = fixed ?? pickRandomLocations(ROUNDS_PER_GAME);
      setLocs(chosen);
      setRound(0);
      setResults([]);
      setGuess(null);
      setHeading(Math.floor(Math.random() * 360));
      setShowHint(false);
      setIsChallenge(!!fixed);
      setPhase("playing");
    },
    []
  );

  // auto-start if ?c= challenge link shared by a stranger
  useEffect(() => {
    const c = searchParams.get("c");
    const decoded = decodeChallenge(c);
    if (decoded && decoded.length > 0 && phase === "menu") start(decoded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loc = locs[round];
  const total = results.reduce((s, r) => s + r.score, 0);

  const doGuess = () => {
    if (!loc) return;
    const distanceKm = guess ? haversineKm(guess.lat, guess.lng, loc.lat, loc.lng) : 99999;
    const score = guess ? scoreForDistance(distanceKm) : 0;
    const res: RoundResult = { loc, guess, distanceKm: guess ? distanceKm : NaN, score };
    const next = [...results, res];
    setResults(next);
    const newTotal = next.reduce((s, r) => s + r.score, 0);
    try {
      if (newTotal > Number(localStorage.getItem("clipars_geo_best") || 0)) {
        localStorage.setItem("clipars_geo_best", String(newTotal));
        setBest(newTotal);
      }
    } catch {}
    setPhase("reveal");
  };

  const doNext = () => {
    if (round + 1 >= locs.length) {
      setPhase("finished");
    } else {
      setRound((r) => r + 1);
      setGuess(null);
      setHeading(Math.floor(Math.random() * 360));
      setShowHint(false);
      setPhase("playing");
    }
  };

  const copyChallenge = async () => {
    const url = `${window.location.origin}/geo?c=${encodeChallenge(locs)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this challenge link:", url);
    }
  };

  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-[#232333] bg-[#0a0a0f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff6b35] font-black text-white">C</Link>
            <span className="font-black tracking-tight">Clipars<span className="text-[#ff3b30]">GEO</span></span>
            <span className="ml-2 hidden rounded-full bg-[#1a1a24] px-2.5 py-1 text-xs text-zinc-400 sm:inline">
              {phase === "playing" || phase === "reveal"
                ? `Round ${Math.min(round + 1, locs.length)}/${locs.length} · ${total} pts`
                : "GeoGuessr-style · Street View · Free"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden rounded-full bg-[#1a1a24] px-3 py-1.5 text-xs text-zinc-300 sm:inline">🏅 Best: {best}</span>
            <Link href="/chat" className="rounded-full bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100">Video chat →</Link>
            <Link href="/" className="rounded-full border border-[#2a2a3a] bg-[#14141c] px-4 py-2 text-xs font-bold hover:bg-[#1a1a24]">Home</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] p-4">
        {phase === "menu" && (
          <section className="mx-auto max-w-[720px] py-10 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ff3b30]/30 bg-[#ff3b30]/10 px-3 py-1 text-xs font-bold tracking-widest text-[#ff8a65]">
              🌍 NEW · CLIPARSGEO
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Dropped somewhere on Earth.<br />
              <span className="bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] bg-clip-text text-transparent">Figure out where.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[52ch] text-zinc-400">
              You get a random Street View spot. Look around for signs, plates, language, sun, vegetation —
              then drop a pin on the map. {ROUNDS_PER_GAME} rounds, {MAX_SCORE_PER_ROUND} pts each, {ROUNDS_PER_GAME * MAX_SCORE_PER_ROUND} total.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => start()} className="rounded-2xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-8 py-4 font-black text-white shadow-xl shadow-red-500/20 hover:brightness-110">
                ▶ Start game
              </button>
              <Link href="/chat" className="rounded-2xl border border-[#2a2a3a] bg-[#14141c] px-8 py-4 font-bold hover:bg-[#1a1a24]">
                Play with a stranger →
              </Link>
            </div>
            <div className="mx-auto mt-8 grid gap-3 text-left text-sm sm:grid-cols-3">
              {[
                { t: "1 · Explore", d: "Drag inside Street View. Spot language, road signs, plates, architecture." },
                { t: "2 · Pin the map", d: "Click anywhere on the world map to place your guess marker." },
                { t: "3 · Score", d: "Closer = more points. Share the challenge link to battle a stranger." },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-[#232333] bg-[#0f0f16] p-4">
                  <p className="font-bold">{c.t}</p>
                  <p className="mt-1 text-zinc-400">{c.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-zinc-500">Street View via Google embed · guess map © OpenStreetMap · no API key needed</p>
          </section>
        )}

        {(phase === "playing" || phase === "reveal") && loc && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {locs.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < results.length ? "bg-emerald-500" : i === round ? "bg-[#ff3b30] animate-pulse" : "bg-[#232333]"}`}
                />
              ))}
              <span className="ml-2 text-xs text-zinc-400">Round {round + 1}/{locs.length}{isChallenge ? " · challenge mode" : ""}</span>
              <span className="ml-auto text-xs font-bold text-zinc-200">Total: {total} pts</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="overflow-hidden rounded-2xl border border-[#232333] bg-[#0f0f16]">
                <div className="flex items-center justify-between border-b border-[#232333] bg-[#14141c] px-4 py-2.5">
                  <p className="text-sm font-bold">📍 Mystery location {round + 1}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setHeading(Math.floor(Math.random() * 360))} className="rounded-full border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-1.5 text-xs font-semibold hover:bg-[#1a1a24]">
                      🔄 New angle
                    </button>
                    <button onClick={() => setShowHint((v) => !v)} className="rounded-full border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-1.5 text-xs font-semibold hover:bg-[#1a1a24]">
                      {showHint ? "🙈 Hide hint" : "💡 Hint"}
                    </button>
                    <a href={googleMapsLink(loc.lat, loc.lng)} target="_blank" rel="noreferrer" className="rounded-full border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-1.5 text-xs font-semibold hover:bg-[#1a1a24]">
                      ↗ Full view
                    </a>
                  </div>
                </div>
                <iframe
                  key={`${loc.id}-${heading}`}
                  title="street view"
                  src={streetViewEmbedUrl(loc.lat, loc.lng, heading)}
                  className="h-[380px] w-full border-0 bg-black"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {showHint && (
                  <p className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">💡 {loc.hint}</p>
                )}
              </section>

              <section className="space-y-3">
                <GuessMap guess={guess} reveal={phase === "reveal" ? loc : null} onGuess={phase === "playing" ? setGuess : () => {}} />
                {phase === "playing" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={doGuess}
                      disabled={!guess}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-6 py-3.5 font-black text-white shadow-lg shadow-red-500/20 hover:brightness-110 disabled:opacity-40"
                    >
                      {guess ? "Guess! →" : "Click the map to place your pin"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-200">
                      📍 It was <b className="text-white">{loc.name}, {loc.country}</b>
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">
                      {results[results.length - 1]?.score} <span className="text-sm font-bold text-zinc-400">pts</span>
                      <span className="ml-3 text-sm font-semibold text-zinc-300">
                        {guess ? formatDistance(results[results.length - 1]?.distanceKm ?? 0) + " away" : "no guess"}
                      </span>
                    </p>
                    <button onClick={doNext} className="mt-3 w-full rounded-xl bg-white px-6 py-3 font-black text-black hover:bg-zinc-100">
                      {round + 1 >= locs.length ? "See final score →" : "Next round →"}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {phase === "finished" && (
          <section className="mx-auto max-w-[720px] py-8 text-center">
            <p className="text-xs font-black tracking-widest text-zinc-400">FINAL SCORE</p>
            <p className="mt-2 text-6xl font-black">{total}<span className="text-xl text-zinc-500">/{ROUNDS_PER_GAME * MAX_SCORE_PER_ROUND}</span></p>
            <p className="mt-2 text-lg font-bold text-[#ff8a65]">{grade(total)}</p>
            <div className="mt-6 space-y-2 text-left">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#232333] bg-[#0f0f16] p-4 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1a1a24] font-black">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{r.loc.name}, {r.loc.country}</p>
                    <p className="text-xs text-zinc-500">{r.guess ? `${formatDistance(r.distanceKm)} away` : "skipped"}</p>
                  </div>
                  <span className="font-black">{r.score} pts</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => start()} className="rounded-2xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-8 py-4 font-black text-white hover:brightness-110">
                ↻ Play again
              </button>
              <button onClick={copyChallenge} className="rounded-2xl border border-[#2a2a3a] bg-[#14141c] px-8 py-4 font-bold hover:bg-[#1a1a24]">
                {copied ? "✓ Link copied!" : "🔗 Copy challenge link"}
              </button>
              <Link href="/chat" className="rounded-2xl bg-white px-8 py-4 font-black text-black hover:bg-zinc-100">
                Challenge a stranger →
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Send the challenge link in chat — same {ROUNDS_PER_GAME} spots, highest score wins.</p>
          </section>
        )}
      </div>

      <footer className="mx-auto max-w-[1280px] px-4 py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} CliparsGEO — Street View © Google · map © OpenStreetMap · <Link href="/" className="underline">Home</Link> · <Link href="/chat" className="underline">Video chat</Link></p>
      </footer>
    </main>
  );
}

export default function GeoPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#07070a] text-zinc-400">Loading CliparsGEO…</main>}>
      <GameInner />
    </Suspense>
  );
}
