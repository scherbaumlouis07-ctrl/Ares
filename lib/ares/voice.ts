"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AresState } from "@/components/ares/voice-visualizer";

export type MicStatus = "unrequested" | "granted" | "denied" | "unsupported";
export type VisualStage = "circle" | "revealing" | "face" | "concealing";
type VoiceMode = "passive" | "active";

const IDLE_LABEL = "Ares ist online, Sir.";
const LISTENING_LABEL = "Ich höre, Sir...";
const ERROR_LABEL = "Ares konnte gerade nicht antworten.";

// Shared duration for the circle <-> face transition, in both directions —
// exported so the visual components animate in lockstep with this timing.
export const FACE_TRANSITION_MS = 3600;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const WAKE_ACK_PHRASES = [
  "Zu Diensten, Sir.",
  "Was kann ich für Sie tun, Sir?",
  "Ich höre, Sir.",
  "Bereit, Sir.",
  "Zu Ihren Diensten.",
  "Was benötigen Sie, Sir?",
  "Ich bin bereit.",
];

const CLOSE_PHRASES = ["Jederzeit, Sir.", "Sehr gerne.", "Natürlich, Sir.", "Zu Diensten."];

interface AresMessage {
  role: "user" | "assistant";
  content: string;
}

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function getRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?]+$/g, "");
}

/** Edit distance between two strings — used to tolerate speech-recognition mishearings. */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[rows - 1][cols - 1];
}

/** Catches STT mishearings of "Ares" (Aris, Arres, Ehres, ...) without matching unrelated words. */
function soundsLikeAres(word: string): boolean {
  if (word.length < 3 || word.length > 6) return false;
  return levenshtein(word, "ares") <= 2;
}

/** Catches STT mishearings of "Danke" (Tanke, Danker, ...). */
function soundsLikeDanke(word: string): boolean {
  if (word.length < 4 || word.length > 7) return false;
  return levenshtein(word, "danke") <= 2;
}

/** "ares wie ist mein tag" -> woke, command="wie ist mein tag". "ares" alone -> woke, command="". */
function extractWakeCommand(text: string): { woke: boolean; command: string } {
  const words = normalize(text).split(/\s+/);
  const wakeIndex = words.findIndex((w) => soundsLikeAres(w));
  if (wakeIndex === -1) return { woke: false, command: "" };
  return { woke: true, command: words.slice(wakeIndex + 1).join(" ").trim() };
}

/** Only treats a short, standalone "Danke" (or a close mishearing of it) as the close word. */
function isCloseWord(text: string): boolean {
  const words = normalize(text).split(/\s+/);
  return words.length <= 2 && soundsLikeDanke(words[0]);
}

/**
 * Drives the always-listening voice system: passive wake-word detection
 * ("Ares"), an active multi-turn conversation once woken, and a "Danke"
 * close word that saves the session and returns to passive listening.
 *
 * Wake-word matching happens entirely in the browser against the free
 * Web Speech API transcript — nothing is sent to Claude until "Ares" is
 * actually heard, which is what keeps passive listening free of API cost.
 */
export function useAresVoice() {
  const [micStatus, setMicStatus] = useState<MicStatus>("unrequested");
  const [visualState, setVisualState] = useState<AresState>("idle");
  const [visualStage, setVisualStage] = useState<VisualStage>("circle");
  const [statusText, setStatusText] = useState(IDLE_LABEL);
  // Increments on each spoken word boundary — drives the mouth glow pulse
  // on the face so it looks like Ares is the one actually talking.
  const [mouthPulse, setMouthPulse] = useState(0);
  // Live microphone volume (0-1) while Ares is listening — drives a subtle
  // reactive glow so the face responds to the user's own voice, not just a
  // fixed animation.
  const [micLevel, setMicLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const speakingRef = useRef(false);
  const speakingTextRef = useRef("");
  const modeRef = useRef<VoiceMode>("passive");
  const historyRef = useRef<unknown[]>([]);
  const transcriptLogRef = useRef<AresMessage[]>([]);
  const conversationIdRef = useRef<string>("");
  // Bumped on every new command — lets an in-flight, now-superseded turn
  // (one Ares was interrupted mid-reply) recognize it's stale and skip its
  // trailing state updates instead of clobbering the newer turn's.
  const turnIdRef = useRef(0);

  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micLevelRafRef = useRef<number | null>(null);

  const stopMicLevelMonitor = useCallback(() => {
    if (micLevelRafRef.current !== null) cancelAnimationFrame(micLevelRafRef.current);
    micLevelRafRef.current = null;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    micAnalyserRef.current = null;
    void micAudioCtxRef.current?.close().catch(() => {});
    micAudioCtxRef.current = null;
    setMicLevel(0);
  }, []);

  // Keeps a persistent analyser on the mic input so the LISTENING animation
  // can react to actual volume — separate from SpeechRecognition, which
  // never exposes raw audio to the page.
  const startMicLevelMonitor = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    if (micStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtx) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      micStreamRef.current = stream;
      micAudioCtxRef.current = ctx;
      micAnalyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const centered = (data[i] - 128) / 128;
          sumSquares += centered * centered;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        setMicLevel(Math.min(1, rms * 4));
        micLevelRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic already granted via enableMicrophone in the normal flow — if
      // this fails, the face simply skips the reactive glow.
    }
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setVisualState("speaking");
      setStatusText(text);

      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      speakingRef.current = true;
      speakingTextRef.current = normalize(text);
      // Recognition deliberately keeps running during speech (see
      // handleFinalTranscript) so the user can interrupt Ares mid-sentence.

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      const deVoice = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith("de"));
      if (deVoice) utterance.voice = deVoice;

      // Best-effort lip-sync: not every voice/engine fires word boundaries,
      // but where it's supported this pulses the face flicker per word.
      utterance.onboundary = () => {
        setMouthPulse((n) => n + 1);
      };

      const finish = () => {
        speakingRef.current = false;
        speakingTextRef.current = "";
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const saveSession = useCallback(async () => {
    if (transcriptLogRef.current.length === 0) return;
    const supabase = createClient();
    const rows = transcriptLogRef.current.map((m) => ({
      conversation_id: conversationIdRef.current,
      role: m.role,
      content: m.content,
    }));
    await supabase.from("conversations").insert(rows);
    transcriptLogRef.current = [];
    historyRef.current = [];
  }, []);

  const handleCommand = useCallback(
    async (text: string) => {
      const myTurn = ++turnIdRef.current;
      transcriptLogRef.current.push({ role: "user", content: text });

      try {
        const res = await fetch("/api/ares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: historyRef.current }),
        });
        const data = await res.json();
        const reply: string = res.ok ? data.reply || "..." : ERROR_LABEL;
        if (res.ok) historyRef.current = data.history ?? historyRef.current;
        transcriptLogRef.current.push({ role: "assistant", content: reply });
        await speak(reply);
      } catch {
        await speak(ERROR_LABEL);
      }

      // A newer command (the user interrupted this one) already took over —
      // don't let this stale turn overwrite its state.
      if (turnIdRef.current !== myTurn) return;

      if (modeRef.current === "active") {
        setVisualState("listening");
        setStatusText(LISTENING_LABEL);
      }
    },
    [speak]
  );

  const handleFinalTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (modeRef.current === "passive") {
        const { woke, command } = extractWakeCommand(text);
        if (!woke) return;

        modeRef.current = "active";
        conversationIdRef.current = crypto.randomUUID();
        historyRef.current = [];
        transcriptLogRef.current = [];

        // Circle recedes and the face emerges before Ares speaks — the
        // acknowledgment lands once the face has settled into position.
        setVisualStage("revealing");
        await wait(FACE_TRANSITION_MS);
        setVisualStage("face");

        await speak(pickRandom(WAKE_ACK_PHRASES));

        if (command) {
          await handleCommand(command);
        } else if (modeRef.current === "active") {
          setVisualState("listening");
          setStatusText(LISTENING_LABEL);
        }
        return;
      }

      // Active conversation: if Ares is still talking, this is the user
      // barging in — stop the TTS immediately unless it's just the mic
      // picking up Ares's own voice (heard text closely matches what's
      // currently being spoken).
      if (speakingRef.current) {
        const heard = normalize(text);
        const isLikelyEcho = heard.length > 0 && speakingTextRef.current.includes(heard);
        if (isLikelyEcho) return;
        window.speechSynthesis?.cancel();
      }

      // Active conversation: either the close word, or the next command.
      if (isCloseWord(text)) {
        await speak(pickRandom(CLOSE_PHRASES));

        // Same movement, exactly reversed: face recedes, circle returns.
        setVisualStage("concealing");
        await wait(FACE_TRANSITION_MS);
        setVisualStage("circle");

        await saveSession();
        modeRef.current = "passive";
        setVisualState("idle");
        setStatusText(IDLE_LABEL);
        return;
      }

      await handleCommand(text);
    },
    [handleCommand, saveSession, speak]
  );

  const startRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setMicStatus("unsupported");
      return;
    }

    // Tear down any previous instance first (e.g. React Strict Mode's
    // dev-only double effect run) — otherwise the stale instance's onend
    // can race with this one and restart itself, and both instances end up
    // fighting over the same microphone.
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      try {
        recognitionRef.current.abort();
      } catch {
        // already stopped — ignore
      }
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "de-DE";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0]?.transcript ?? "";
          console.log("[ares-voice] heard:", transcript);
          void handleFinalTranscript(transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("[ares-voice] recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("[ares-voice] recognition ended, shouldListen:", shouldListenRef.current, "speaking:", speakingRef.current);
      if (shouldListenRef.current && !speakingRef.current) {
        try {
          recognition.start();
        } catch {
          // already running — ignore
        }
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    recognition.start();
  }, [handleFinalTranscript]);

  const enableMicrophone = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicStatus("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We only needed this call to trigger/confirm the permission prompt —
      // actual audio capture for recognition is handled by the browser's
      // own SpeechRecognition engine, not this stream.
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
      startRecognition();
      void startMicLevelMonitor();
    } catch {
      setMicStatus("denied");
    }
  }, [startRecognition, startMicLevelMonitor]);

  // If the mic was already granted in an earlier visit, resume listening
  // automatically — "einmalig aktivieren, danach dauerhaft" only works if we
  // don't ask again on every page load. Safari doesn't support querying
  // microphone permission state, so it falls back to showing the button.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (status.state === "granted") {
          setMicStatus("granted");
          startRecognition();
          void startMicLevelMonitor();
        }
      })
      .catch(() => {
        // Permissions API for "microphone" unsupported — user sees the button.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      stopMicLevelMonitor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    micStatus,
    visualState,
    visualStage,
    statusText,
    mouthPulse,
    micLevel,
    enableMicrophone,
  };
}
