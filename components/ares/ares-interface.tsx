"use client";

import { useState } from "react";
import { Starfield } from "./starfield";
import { VoiceVisualizer } from "./voice-visualizer";
import { FaceReveal } from "./face-reveal";
import { useAresVoice, FACE_TRANSITION_MS } from "@/lib/ares/voice";
import { cn } from "@/lib/utils";

// iOS/iPadOS forces every browser (including "Chrome" or "Edge" there) to
// run on WebKit under the hood — so telling an iPhone/iPad user to switch
// browsers, like the desktop message does, would be actively misleading.
function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function AresInterface() {
  const { micStatus, visualState, visualStage, statusText, mouthPulse, micLevel, enableMicrophone } =
    useAresVoice();
  const faceVisible = visualStage === "revealing" || visualStage === "face";
  const [appleMobile] = useState(isAppleMobile);

  return (
    <div className="relative flex-1 h-full flex items-center justify-center overflow-hidden bg-bg">
      <Starfield />
      <FaceReveal
        stage={visualStage}
        speaking={visualState === "speaking"}
        mouthPulse={mouthPulse}
        micLevel={micLevel}
      />
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        <div
          className={cn(
            "relative flex items-center justify-center transition-all ease-[cubic-bezier(0.22,1,0.36,1)]",
            faceVisible ? "scale-75 opacity-0 blur-2xl" : "scale-100 opacity-100 blur-none"
          )}
          style={{ transitionDuration: `${FACE_TRANSITION_MS}ms` }}
        >
          <VoiceVisualizer state={visualState} />
          <span
            className={cn(
              "absolute max-w-[170px] text-center text-sm tracking-wide transition-colors duration-300",
              visualState === "idle" ? "text-text-secondary" : "text-text"
            )}
          >
            {statusText}
          </span>
        </div>

        {micStatus === "unrequested" && (
          <button
            onClick={enableMicrophone}
            className="px-5 py-2.5 border border-border-strong text-xs font-medium uppercase tracking-wider text-text hover:border-text-secondary transition-colors"
          >
            Ares Mikrofon aktivieren
          </button>
        )}

        {micStatus === "denied" && (
          <p className="text-sm text-critical text-center max-w-md">
            Mikrofonzugriff verweigert. Bitte in den Browser-Einstellungen für diese Seite
            erlauben und neu laden.
          </p>
        )}

        {micStatus === "unsupported" && (
          <p className="text-sm text-text-muted text-center max-w-md">
            {appleMobile
              ? "Sprachsteuerung wird auf iPhone/iPad aktuell nicht unterstützt — das liegt an iOS selbst (jede App nutzt dort dieselbe Engine), ein anderer Browser ändert das nicht. Bitte auf einem Laptop/Desktop mit Chrome oder Edge verwenden."
              : "Sprachsteuerung wird von diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden."}
          </p>
        )}
      </div>
    </div>
  );
}
