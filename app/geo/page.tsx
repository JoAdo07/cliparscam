"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ROUNDS_PER_GAME,
  MAX_SCORE_PER_ROUND,
  SPOTS,
  decodeSeed,
  encodeSeed,
  formatDistance,
  formatTime,
  googleMapsLink,
  haversineKm,
  makePartyCode,
  pickRandomSpots,
  reverseCountry,
  scoreForDistance,
  streetViewEmbedUrl,
} from "@/lib/geo";

type Mode = "classic" | "streak" | "party";
type Phase = "menu" | "lobby" | "playing" | "reveal" | "finished";
type Guess = { lat: number; lng: number };
type RoundResult = { spotIdx: number; guess: Guess | null; distanceKm: number; score: number };
type Player = { userId: string; name: string; total: number; round: number; done: boolean };

// ---- Leaflet via CDN (no npm dep, no API key) ----
function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if ((loadLeaflet as any)._p) return (loadLeaflet as any)._p;
  (loadLeaflet as any)._p = new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-leaflet-css]")) {
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
    script.onerror = () => reject(new Error("map failed"));
    document.head.appendChild(script);
  });
  return (loadLeaflet as any)._p;
}

// Compact guess map, expands on hover like the original game.
function GuessMap({
  guess,
  revealIdx,
  onGuess,
  frozen,
  big,
}: {
  guess: Guess | null;
  revealIdx: number | null;
  onGuess: (g: Guess) => void;
  frozen: boolean;
  big: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const onGuessRef = useRef(onGuess);
  onGuessRef.current = onGuess;
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L: any) => {
        if (cancelled || !divRef.current || mapRef.current) return;
        const map = L.map(divRef.current, { worldCopyJump: true, minZoom: 2, maxZoom: 18, zoomControl: false, attributionControl: false });
        map.setView([20, 0], 2);
        L.control.zoom({ position: "topright" }).addTo(map);
        L.control.attribution({ prefix: false }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a>').addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        map.on("click", (e: any) => {
          if (!frozenRef.current) onGuessRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 250);
      })
      .catch(() => setErr(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (map) setTimeout(() => map.invalidateSize(), 250);
    if (!map || !L || !layerRef.current) return;
    layerRef.current.clearLayers();
    if (guess) {
      L.circleMarker([guess.lat, guess.lng], { radius: 8, color: "#ff3b30", weight: 3, fillColor: "#ff3b30", fillOpacity: 0.9 })
        .bindTooltip("Your guess").addTo(layerRef.current);
    }
    if (revealIdx !== null) {
      const s = SPOTS[revealIdx];
      L.circleMarker([s.lat, s.lng], { radius: 8, color: "#22c55e", weight: 3, fillColor: "#22c55e", fillOpacity: 0.9 })
        .bindTooltip(`${s.country}`).addTo(layerRef.current);
      if (guess) {
        L.polyline([[guess.lat, guess.lng], [s.lat, s.lng]], { color: "#fff", weight: 2, dashArray: "6 6" }).addTo(layerRef.current);
        map.flyToBounds(L.latLngBounds([guess.lat, guess.lng], [s.lat, s.lng]).pad(0.4), { duration: 1 });
      } else {
        map.flyTo([s.lat, s.lng], 4, { duration: 1 });
      }
    } else if (guess) {
      map.flyTo([guess.lat, guess.lng], Math.max(map.getZoom(), 3), { duration: 0.5 });
    }
  }, [guess, revealIdx, big]);

  if (err) return <div className="grid h-full place-items-center p-4 text-center text-xs text-zinc-400">Map blocked offline — reload to retry.</div>;
  return <div ref={divRef} className="h-full w-full bg-[#0a0a0f]" />;
}

function grade(total: number): string {
  const pct = total / (ROUNDS_PER_GAME * MAX_SCORE_PER_ROUND);
  if (pct >= 0.9) return "Legendary explorer 🏆";
  if (pct >= 0.7) return "Sharp detective 🕵️";
  if (pct >= 0.45) return "Solid traveller ✈️";
  if (pct >= 0.25) return "Wandering rookie 🧭";
  return "Lost tourist 😅";
}

function useName(): [string, (n: string) => void] {
  const [name, setNameState] = useState("Player");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clipars_name");
      if (saved) setNameState(saved);
    } catch {}
  }, []);
  const setName = (n: string) => {
    const v = n.trim().slice(0, 20) || "Player";
    setNameState(v);
    try { localStorage.setItem("clipars_name", v); } catch {}
  };
  return [name, setName];
}

function GameInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("classic");
  const [phase, setPhase] = useState<Phase>("menu");
  const [seed, setSeed] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [heading, setHeading] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintCountry, setHintCountry] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState(0);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useName();
  // streak
  const [streak, setStreak] = useState(0);
  const [streakBest, setStreakBest] = useState(0);
  const [streakOver, setStreakOver] = useState(false);
  const [checking, setChecking] = useState(false);
  // party
  const [partyCode, setPartyCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "ssr";
    let id = localStorage.getItem("clipars_uid");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("clipars_uid", id); }
    return id;
  });
  const channelRef = useRef<any>(null);
  const seedRef = useRef<number[]>([]);
  seedRef.current = seed;
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const roundRef = useRef(round);
  roundRef.current = round;

  const total = results.reduce((s, r) => s + r.score, 0);
  const spotIdx = seed[round];
  const spot = spotIdx !== undefined ? SPOTS[spotIdx] : null;

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("clipars_geo_best") || 0));
      setStreakBest(Number(localStorage.getItem("clipars_geo_streak_best") || 0));
    } catch {}
  }, []);

  // elapsed timer while playing
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, round]);

  const startClassic = useCallback((fixed?: number[]) => {
    setMode("classic");
    setSeed(fixed ?? pickRandomSpots(ROUNDS_PER_GAME));
    setRound(0); setResults([]); setGuess(null);
    setHeading(Math.floor(Math.random() * 360));
    setHintUsed(false); setHintCountry(null);
    setElapsed(0); setPhase("playing");
  }, []);

  const startStreak = useCallback(() => {
    setMode("streak");
    setSeed(pickRandomSpots(1));
    setRound(0); setGuess(null);
    setHeading(Math.floor(Math.random() * 360));
    setStreak(0); setStreakOver(false); setElapsed(0);
    setPhase("playing");
  }, []);

  // deep links: ?c= challenge or ?party=CODE&s= party seed
  useEffect(() => {
    const c = searchParams.get("c");
    const p = searchParams.get("party");
    const s = searchParams.get("s");
    if (p && s) {
      const idx = decodeSeed(s);
      if (idx) {
        setMode("party"); setPartyCode(p.toUpperCase()); setIsHost(false);
        setSeed(idx); setRound(0); setResults([]); setGuess(null);
        setHeading(Math.floor(Math.random() * 360));
        setHintUsed(false); setHintCountry(null); setElapsed(0);
        setPhase("playing");
        joinPartyChannel(p.toUpperCase(), false);
      }
    } else if (c) {
      const idx = decodeSeed(c);
      if (idx && phase === "menu") startClassic(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- party channel ----
  const updatePresence = useCallback(async () => {
    if (!channelRef.current || userId === "ssr") return;
    const r = resultsRef.current;
    const t = r.reduce((s, x) => s + x.score, 0);
    try {
      await channelRef.current.track({
        userId, name: localStorage.getItem("clipars_name") || "Player",
        total: t, round: roundRef.current, done: r.length >= ROUNDS_PER_GAME,
      });
    } catch {}
  }, [userId]);

  const joinPartyChannel = useCallback((code: string, host: boolean) => {
    try { channelRef.current?.unsubscribe(); } catch {}
    const ch = supabase.channel(`clipars:party:${code}`, {
      config: { presence: { key: userId === "ssr" ? "init" : userId } },
    });
    channelRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      setPlayers(Object.values(state).flat() as Player[]);
    })
      .on("broadcast", { event: "seed" }, ({ payload }: any) => {
        if (!host && payload?.to === userId && Array.isArray(payload.seed)) {
          const idx = (payload.seed as number[]).filter((v) => Number.isInteger(v) && v >= 0 && v < SPOTS.length).slice(0, ROUNDS_PER_GAME);
          if (idx.length > 0) {
            setSeed(idx); setRound(0); setResults([]); setGuess(null);
            setHeading(Math.floor(Math.random() * 360));
            setHintUsed(false); setHintCountry(null); setElapsed(0);
            setPhase("playing");
          }
        }
      })
      .on("broadcast", { event: "seed-request" }, ({ payload }: any) => {
        if (host && seedRef.current.length > 0) {
          ch.send({ type: "broadcast", event: "seed", payload: { to: payload.from, seed: seedRef.current } });
        }
      })
      .on("broadcast", { event: "begin" }, () => {
        if (!host) {
          setRound(0); setResults([]); setGuess(null);
          setHeading(Math.floor(Math.random() * 360));
          setHintUsed(false); setHintCountry(null); setElapsed(0);
          setPhase("playing");
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await updatePresence();
          if (!host) ch.send({ type: "broadcast", event: "seed-request", payload: { from: userId } });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => () => { try { channelRef.current?.unsubscribe(); } catch {} }, []);
  useEffect(() => { if (phase === "playing" || phase === "reveal" || phase === "finished") updatePresence(); }, [phase, results, updatePresence]);

  const createParty = () => {
    const code = makePartyCode();
    const s = pickRandomSpots(ROUNDS_PER_GAME);
    setPartyCode(code); setIsHost(true); setMode("party");
    setSeed(s); setPlayers([]);
    setPhase("lobby");
    joinPartyChannel(code, true);
  };

  const joinPartyByCode = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 3) return;
    setPartyCode(code); setIsHost(false); setMode("party"); setPlayers([]);
    setPhase("lobby");
    joinPartyChannel(code, false);
  };

  const partyLink = () =>
    typeof window === "undefined" ? "" : `${window.location.origin}/geo?party=${partyCode}&s=${encodeSeed(seed)}`;

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { prompt("Copy:", text); }
  };

  // ---- guessing ----
  const doGuess = () => {
    if (!spot || spotIdx === undefined || !guess) return;
    const d = haversineKm(guess.lat, guess.lng, spot.lat, spot.lng);
    const score = scoreForDistance(d, hintUsed);
    setResults((r) => [...r, { spotIdx, guess, distanceKm: d, score }]);
    setPhase("reveal");
    try {
      const t = total + score;
      if (t > Number(localStorage.getItem("clipars_geo_best") || 0)) {
        localStorage.setItem("clipars_geo_best", String(t));
        setBest(t);
      }
    } catch {}
  };

  const doNext = () => {
    if (round + 1 >= seed.length) setPhase("finished");
    else {
      setRound((r) => r + 1); setGuess(null);
      setHeading(Math.floor(Math.random() * 360));
      setHintUsed(false); setHintCountry(null);
      setPhase("playing");
    }
  };

  const skipSpot = () => {
    const fresh = pickRandomSpots(1, new Set(seed))[0];
    setSeed((s) => s.map((v, i) => (i === round ? fresh : v)));
    setHeading(Math.floor(Math.random() * 360));
    setHintUsed(false); setHintCountry(null); setGuess(null);
  };

  const useHint = () => {
    if (!spot || hintUsed) return;
    setHintUsed(true);
    setHintCountry(spot.country); // halves points, like worldguessr
  };

  const doStreakGuess = async () => {
    if (!spot || !guess || checking) return;
    setChecking(true);
    const geo = await reverseCountry(guess.lat, guess.lng);
    setChecking(false);
    if (!geo) { alert("Couldn't verify that pin (offline?) — try again."); return; }
    if (geo.code === spot.code) {
      const ns = streak + 1;
      setStreak(ns);
      try {
        if (ns > Number(localStorage.getItem("clipars_geo_streak_best") || 0)) {
          localStorage.setItem("clipars_geo_streak_best", String(ns));
          setStreakBest(ns);
        }
      } catch {}
      setSeed(pickRandomSpots(1, new Set([spotIdx ?? -1])));
      setGuess(null);
      setHeading(Math.floor(Math.random() * 360));
    } else {
      setStreakOver(true);
      setPhase("finished");
    }
  };

  const quitToMenu = () => {
    try { channelRef.current?.unsubscribe(); } catch {}
    channelRef.current = null;
    setPhase("menu"); setPlayers([]); setPartyCode("");
  };

  // ================= MENU =================
  if (phase === "menu") {
    return (
      <main className="min-h-screen bg-[#07070a] text-zinc-100">
        <header className="border-b border-[#232333] bg-[#0a0a0f]/80">
          <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff6b35] font-black text-white">C</span>
              <span className="font-black tracking-tight">Clipars<span className="text-[#ff3b30]">GEO</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/chat" className="rounded-full bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100">Video chat →</Link>
              <Link href="/" className="rounded-full border border-[#2a2a3a] bg-[#14141c] px-4 py-2 text-xs font-bold hover:bg-[#1a1a24]">Home</Link>
            </div>
          </div>
        </header>
        <section className="mx-auto max-w-[720px] px-4 py-10 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#ff3b30]/30 bg-[#ff3b30]/10 px-3 py-1 text-xs font-bold tracking-widest text-[#ff8a65]">🌍 RANDOM ROADS · WHOLE WORLD</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Dropped on a random road.<br />
            <span className="bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] bg-clip-text text-transparent">Where are you?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-zinc-400">
            Real GeoGuessr rules: any road on Earth, move around, read the landscape.
            5 rounds · 5,000 pts each · exponential scoring.
          </p>
          <div className="mx-auto mt-6 max-w-[420px]">
            <label className="mb-1 block text-left text-xs font-bold tracking-widest text-zinc-500">YOUR NAME (for party leaderboard)</label>
            <input defaultValue={name} onBlur={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="w-full rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 text-sm outline-none focus:border-[#ff3b30]" />
          </div>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <button onClick={() => startClassic()} className="rounded-2xl border border-[#232333] bg-[#0f0f16] p-5 text-left hover:border-[#ff3b30]/60">
              <p className="text-2xl">🗺️</p>
              <p className="mt-2 font-black">Classic</p>
              <p className="mt-1 text-sm text-zinc-400">5 random roads. Closest pin wins points. Best: {best}</p>
            </button>
            <button onClick={startStreak} className="rounded-2xl border border-[#232333] bg-[#0f0f16] p-5 text-left hover:border-[#ff3b30]/60">
              <p className="text-2xl">🔥</p>
              <p className="mt-2 font-black">Country streak</p>
              <p className="mt-1 text-sm text-zinc-400">Name the country every round. One miss = over. Best: {streakBest}</p>
            </button>
            <button onClick={createParty} className="rounded-2xl border border-[#ff3b30]/40 bg-gradient-to-b from-[#ff3b30]/15 to-transparent p-5 text-left hover:border-[#ff3b30]">
              <p className="text-2xl">⚔️</p>
              <p className="mt-2 font-black">Party vs stranger</p>
              <p className="mt-1 text-sm text-zinc-400">Same 5 roads, live leaderboard. Send the link in chat.</p>
            </button>
          </div>
          <div className="mx-auto mt-4 flex max-w-[420px] gap-2">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Party code (e.g. KQZT)"
              className="flex-1 rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 text-sm uppercase outline-none focus:border-[#ff3b30]" />
            <button onClick={joinPartyByCode} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black">Join</button>
          </div>
          <p className="mt-6 text-xs text-zinc-500">Street View © Google · map © OpenStreetMap · game rules adapted from worldguessr (noncommercial)</p>
        </section>
      </main>
    );
  }

  // ================= PARTY LOBBY =================
  if (phase === "lobby") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07070a] p-4 text-zinc-100">
        <div className="w-full max-w-[480px] rounded-3xl border border-[#232333] bg-[#0f0f16] p-8 text-center">
          <p className="text-xs font-black tracking-widest text-zinc-400">PARTY CODE</p>
          <p className="mt-2 text-6xl font-black tracking-widest">{partyCode}</p>
          <p className="mt-3 text-sm text-zinc-400">Share this link — same 5 roads for everyone:</p>
          <button onClick={() => copyText(partyLink())} className="mt-2 w-full break-all rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 text-xs text-zinc-300 hover:border-[#ff3b30]">
            {copied ? "✓ Copied!" : partyLink()}
          </button>
          <div className="mt-4 rounded-2xl bg-[#0a0a0f] p-4 text-left text-sm">
            <p className="mb-2 text-xs font-bold tracking-widest text-zinc-500">PLAYERS ({players.length || 1})</p>
            {(players.length ? players : [{ userId, name, total: 0, round: 0, done: false }]).map((p) => (
              <p key={p.userId} className="flex justify-between py-0.5"><span>{p.name}</span><span className="text-zinc-500">{p.total} pts</span></p>
            ))}
          </div>
          {isHost ? (
            <button onClick={() => { channelRef.current?.send({ type: "broadcast", event: "begin", payload: {} }); setRound(0); setResults([]); setGuess(null); setHeading(Math.floor(Math.random() * 360)); setHintUsed(false); setHintCountry(null); setElapsed(0); setPhase("playing"); }}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-6 py-4 font-black text-white hover:brightness-110">Start party →</button>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">Waiting for the host to start… (spots arrive automatically)</p>
          )}
          <button onClick={quitToMenu} className="mt-3 text-xs text-zinc-500 underline">Leave</button>
        </div>
      </main>
    );
  }

  const isStreak = mode === "streak";
  const last = results[results.length - 1];

  // ================= GAME (fullscreen pano, original layout) =================
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black text-zinc-100">
      {/* panorama fills the screen */}
      {spot && (
        <iframe
          key={`${spot.lat},${spot.lng},${heading}`}
          title="street view"
          src={streetViewEmbedUrl(spot.lat, spot.lng, heading)}
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {/* top HUD */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 py-2.5 sm:px-4">
        <Link href="/" className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff6b35] font-black text-white">C</Link>
        <span className="hidden font-black tracking-tight sm:inline">Clipars<span className="text-[#ff3b30]">GEO</span></span>
        <span className="ml-1 rounded-full bg-black/60 px-3 py-1 text-xs font-bold backdrop-blur">
          {isStreak ? `🔥 Streak ${streak}` : mode === "party" ? `⚔️ Party ${partyCode} · R${Math.min(round + 1, seed.length)}/${seed.length}` : `Round ${Math.min(round + 1, seed.length)}/${seed.length}`}
        </span>
        {!isStreak && <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-black backdrop-blur">{total} pts</span>}
        <span className="rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">⏱ {formatTime(elapsed)}</span>
        <div className="ml-auto flex gap-1.5">
          {!isStreak && phase === "playing" && spot && (
            <>
              <button onClick={useHint} disabled={hintUsed} title="Reveal country, halves points"
                className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-black/80 disabled:opacity-40">💡 {hintUsed ? spot.country : "Hint ½"}</button>
              <button onClick={skipSpot} title="Dead panorama? Swap for a fresh road, no penalty"
                className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-black/80">⏭ Skip</button>
            </>
          )}
          <button onClick={() => setHeading(Math.floor(Math.random() * 360))} className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-black/80">🔄</button>
          <button onClick={quitToMenu} className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-black/80">✕</button>
        </div>
      </div>
      {hintCountry && phase === "playing" && (
        <div className="absolute left-1/2 top-14 z-20 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/20 px-4 py-1.5 text-sm font-bold text-amber-200 backdrop-blur">
          💡 {hintCountry} · points halved
        </div>
      )}

      {/* party leaderboard */}
      {mode === "party" && players.length > 1 && (
        <div className="absolute left-3 top-16 z-20 w-44 rounded-2xl bg-black/60 p-3 text-xs backdrop-blur">
          <p className="mb-1 font-black tracking-widest text-zinc-400">LIVE BOARD</p>
          {[...players].sort((a, b) => b.total - a.total).slice(0, 6).map((p) => (
            <p key={p.userId} className={`flex justify-between py-0.5 ${p.userId === userId ? "font-black text-white" : "text-zinc-300"}`}>
              <span className="truncate">{p.name}{p.done ? " ✓" : ""}</span><span>{p.total}</span>
            </p>
          ))}
        </div>
      )}

      {/* guess map bottom-right, expands on hover like the original */}
      {phase !== "finished" && (
        <div className={`absolute bottom-3 right-3 z-20 transition-all duration-200 sm:bottom-5 sm:right-5 ${phase === "reveal" ? "h-[46vh] w-[min(92vw,560px)]" : "h-44 w-60 hover:h-[38vh] hover:w-[min(90vw,460px)]"}`}>
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl">
            <div className="min-h-0 flex-1">
              <GuessMap guess={guess} revealIdx={phase === "reveal" ? spotIdx : null} onGuess={phase === "playing" ? setGuess : () => {}} frozen={phase !== "playing"} big={phase === "reveal"} />
            </div>
            {phase === "playing" && (
              <button
                onClick={isStreak ? doStreakGuess : doGuess}
                disabled={!guess || checking}
                className="bg-[#6cb33f] px-4 py-3 text-lg font-black uppercase tracking-wide text-white hover:brightness-110 disabled:opacity-60"
              >
                {checking ? "Checking…" : guess ? (isStreak ? "Guess country" : "Guess") : isStreak ? "Pin a country" : "Place your pin"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* round result card */}
      {phase === "reveal" && last && spot && (
        <div className="absolute bottom-3 left-3 z-20 w-[min(92vw,340px)] rounded-2xl bg-black/75 p-5 backdrop-blur sm:bottom-5 sm:left-5">
          <p className="text-xs font-bold tracking-widest text-zinc-400">{spot.country}</p>
          <p className="mt-1 text-4xl font-black">{last.score}<span className="text-base text-zinc-400"> pts</span></p>
          <p className="mt-1 text-sm text-zinc-300">{formatDistance(last.distanceKm)} away{hintUsed ? " · hint ½" : ""}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#ff3b30] to-[#ff6b35]" style={{ width: `${(last.score / MAX_SCORE_PER_ROUND) * 100}%` }} />
          </div>
          <button onClick={doNext} className="mt-4 w-full rounded-xl bg-white px-6 py-3 font-black text-black hover:bg-zinc-200">
            {round + 1 >= seed.length ? "Final score →" : "Next round →"}
          </button>
        </div>
      )}

      {/* final / streak-over modal */}
      {phase === "finished" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-3xl border border-[#232333] bg-[#0f0f16] p-6 text-center sm:p-8">
            {isStreak || streakOver ? (
              <>
                <p className="text-5xl">🔥</p>
                <p className="mt-2 text-5xl font-black">{streak}</p>
                <p className="mt-1 text-sm text-zinc-400">country streak · best {streakBest}</p>
                {streakOver && spot && <p className="mt-3 text-sm text-zinc-300">That was <b>{spot.country}</b> — streak over!</p>}
                <button onClick={startStreak} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-6 py-4 font-black text-white hover:brightness-110">↻ Play again</button>
              </>
            ) : (
              <>
                <p className="text-xs font-black tracking-widest text-zinc-400">{mode === "party" ? `PARTY ${partyCode} · FINAL` : "FINAL SCORE"}</p>
                <p className="mt-1 text-6xl font-black">{total}<span className="text-xl text-zinc-500">/{ROUNDS_PER_GAME * MAX_SCORE_PER_ROUND}</span></p>
                <p className="mt-1 font-bold text-[#ff8a65]">{grade(total)}</p>
                <div className="mt-4 space-y-2 text-left">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-[#232333] bg-[#0a0a0f] p-3 text-sm">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1a1a24] text-xs font-black">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{SPOTS[r.spotIdx].country}</p>
                        <p className="text-xs text-zinc-500">{r.guess ? `${formatDistance(r.distanceKm)} away` : "skipped"}</p>
                      </div>
                      <span className="font-black">{r.score}</span>
                    </div>
                  ))}
                </div>
                {mode === "party" && players.length > 0 && (
                  <div className="mt-3 rounded-xl border border-[#ff3b30]/30 bg-[#ff3b30]/5 p-3 text-left text-sm">
                    <p className="mb-1 text-xs font-black tracking-widest text-zinc-400">STANDINGS</p>
                    {[...players].sort((a, b) => b.total - a.total).map((p, i) => (
                      <p key={p.userId} className="flex justify-between py-0.5">
                        <span>{i === 0 ? "🥇 " : ""}{p.name}</span><span className="font-bold">{p.total}</span>
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <button onClick={() => startClassic()} className="w-full rounded-2xl bg-gradient-to-r from-[#ff3b30] to-[#ff6b35] px-6 py-3.5 font-black text-white hover:brightness-110">↻ Play again</button>
                  <div className="flex gap-2">
                    <button onClick={() => copyText(`${window.location.origin}/geo?c=${encodeSeed(seed)}`)} className="flex-1 rounded-xl border border-[#2a2a3a] bg-[#14141c] px-4 py-3 text-sm font-bold hover:bg-[#1a1a24]">{copied ? "✓ Copied!" : "🔗 Challenge link"}</button>
                    <Link href="/chat" className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-black">Video chat →</Link>
                  </div>
                  <button onClick={quitToMenu} className="text-xs text-zinc-500 underline">Menu</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
