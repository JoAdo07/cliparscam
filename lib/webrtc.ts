"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string;
  interests: string[];
  onStatus: (s: string) => void;
  onPartner: (id: string | null) => void;
};

const STUN = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];

export function useCliparsMatch({ userId, interests, onStatus, onPartner }: Props) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [textLog, setTextLog] = useState<{ me: boolean; text: string; at: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const cleanupPeer = useCallback(() => {
    if (pcRef.current) {
      try { pcRef.current.ontrack = null; pcRef.current.onicecandidate = null; pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    setRemoteStream(null);
    remoteStreamRef.current = null;
  }, []);

  const createPeer = useCallback((targetId: string | null, isInitiator: boolean, stream: MediaStream | null) => {
    const pc = new RTCPeerConnection({ iceServers: STUN });
    pcRef.current = pc;

    const remote = new MediaStream();
    remoteStreamRef.current = remote;
    setRemoteStream(remote);

    if (stream) {
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
    }

    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach(t => remote.addTrack(t));
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && targetId && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice",
          payload: { from: userId, to: targetId, candidate: e.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        onStatus("Disconnected");
      }
      if (pc.connectionState === "connected") onStatus("Connected");
    };

    return pc;
  }, [userId, onStatus]);

  const sendText = useCallback((text: string) => {
    if (!channelRef.current || !partnerId) return;
    setTextLog(l => [...l, { me: true, text, at: new Date().toLocaleTimeString() }]);
    channelRef.current.send({ type: "broadcast", event: "msg", payload: { from: userId, to: partnerId, text } });
  }, [partnerId, userId]);

  const next = useCallback(async () => {
    cleanupPeer();
    setPartnerId(null);
    onPartner(null);
    setTextLog([]);
    onStatus("Searching...");
    setSearching(true);
    // re-announce searching by updating presence
    if (channelRef.current) {
      await channelRef.current.track({ userId, searching: true, interests, onlineAt: new Date().toISOString() });
    }
  }, [cleanupPeer, interests, onPartner, onStatus, userId]);

  const stop = useCallback(async () => {
    setSearching(false);
    setPartnerId(null);
    onPartner(null);
    cleanupPeer();
    setTextLog([]);
    onStatus("Stopped");
    if (channelRef.current) {
      await channelRef.current.track({ userId, searching: false, interests, onlineAt: new Date().toISOString() });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, [cleanupPeer, interests, onPartner, onStatus, userId]);

  // init local media + supabase channel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t=>t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (e) {
        console.warn("getUserMedia failed, text-only", e);
        onStatus("Camera/mic blocked — text only");
      }
    })();

    const channel = supabase.channel("clipars:lobby", {
      config: { presence: { key: userId }, broadcast: { self: false } }
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        const all = Object.values(state).flat();
        setOnlineCount(all.length);
        if (!searching || partnerId) return;
        // find another searching user not self
        const candidates = all
          .filter((p: any) => p.userId !== userId && p.searching === true)
          .sort(() => 0.5 - Math.random());
        if (candidates.length === 0) return;
        // deterministic tie-break: lower userId initiates
        const peer = candidates[0];
        const shouldInitiate = userId < peer.userId;
        if (!shouldInitiate) return;
        // initiate
        const targetId = peer.userId as string;
        setPartnerId(targetId);
        onPartner(targetId);
        onStatus("Connecting...");
        const pc = createPeer(targetId, true, localStreamRef.current);
        pc.createOffer().then(offer => pc.setLocalDescription(offer).then(() => {
          channel.send({ type: "broadcast", event: "offer", payload: { from: userId, to: targetId, sdp: offer, interests } });
        }));
      })
      .on("broadcast", { event: "offer" }, async ({ payload }: any) => {
        if (payload.to !== userId) return;
        if (partnerId) return; // already paired
        setPartnerId(payload.from);
        onPartner(payload.from);
        onStatus("Incoming call...");
        const pc = createPeer(payload.from, false, localStreamRef.current);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { from: userId, to: payload.from, sdp: answer } });
        onStatus("Connected");
        setSearching(false);
      })
      .on("broadcast", { event: "answer" }, async ({ payload }: any) => {
        if (payload.to !== userId || !pcRef.current) return;
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        onStatus("Connected");
        setSearching(false);
      })
      .on("broadcast", { event: "ice" }, async ({ payload }: any) => {
        if (payload.to !== userId || !pcRef.current) return;
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
      })
      .on("broadcast", { event: "msg" }, ({ payload }: any) => {
        if (payload.to !== userId) return;
        setTextLog(l => [...l, { me: false, text: payload.text, at: new Date().toLocaleTimeString() }]);
      })
      .on("broadcast", { event: "next" }, ({ payload }: any) => {
        if (payload.to !== userId) return;
        // partner skipped us
        cleanupPeer();
        setPartnerId(null);
        onPartner(null);
        setTextLog([]);
        onStatus("Stranger skipped — searching...");
        setSearching(true);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, searching, interests, onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      cancelled = true;
      try { channel.unsubscribe(); } catch {}
      cleanupPeer();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t=>t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep presence in sync when searching toggles
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.track({ userId, searching, interests, onlineAt: new Date().toISOString() });
    }
  }, [searching, interests, userId]);

  const doNext = useCallback(() => {
    if (partnerId && channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "next", payload: { from: userId, to: partnerId } });
    }
    next();
  }, [next, partnerId, userId]);

  return {
    localStream,
    remoteStream,
    textLog,
    sendText,
    searching,
    setSearching,
    partnerId,
    onlineCount,
    next: doNext,
    stop,
  };
}
