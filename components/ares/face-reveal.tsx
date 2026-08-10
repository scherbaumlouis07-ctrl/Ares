import { cn } from "@/lib/utils";
import { FACE_TRANSITION_MS, type VisualStage } from "@/lib/ares/voice";

// Soft-edged ellipse roughly covering the head/face silhouette — only the
// content inside this mask sways or flickers, so the background dot-field
// underneath (rendered separately, statically) never moves.
const HEAD_MASK = "radial-gradient(ellipse 26% 46% at 50% 52%, black 55%, transparent 90%)";

const FACE_IMAGE_CLASS = "absolute inset-0 h-full w-full object-cover mix-blend-screen";

/**
 * The dot-grid face, blended additively over the starfield (full-bleed,
 * object-cover — no visible frame) so its background merges into the page.
 * Mirrors the ring's transition exactly (same duration, reversed direction)
 * so "Ares" and "Danke" produce the same motion forwards and backwards.
 *
 * Three layers reuse the same photo:
 * 1. A static full-image background — always fills the frame, never moves.
 * 2. A head-masked copy with a slow idle sway — only the head moves, not
 *    the background dots, because layer 1 stays put underneath it.
 * 3. A flicker overlay inside the head mask, replayed per spoken word: the
 *    glowing lines briefly brighten/dim unevenly, the way a digital light
 *    construct reacts to speech, rather than an isolated mouth shape. While
 *    Ares is listening instead of talking, the same layer glows in
 *    proportion to the user's live microphone volume.
 */
export function FaceReveal({
  stage,
  speaking,
  mouthPulse,
  micLevel,
}: {
  stage: VisualStage;
  speaking: boolean;
  mouthPulse: number;
  micLevel: number;
}) {
  const visible = stage === "revealing" || stage === "face";
  const flickering = speaking && mouthPulse > 0;
  const reactiveStyle = speaking
    ? { animation: flickering ? "ares-flicker 220ms ease-out" : undefined }
    : {
        filter: `brightness(${1 + Math.min(micLevel, 1) * 0.35})`,
        transition: "filter 80ms linear",
      };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 transition-all ease-[cubic-bezier(0.22,1,0.36,1)]",
          visible ? "scale-100 opacity-100 blur-none" : "scale-75 opacity-0 blur-2xl"
        )}
        style={{ transitionDuration: `${FACE_TRANSITION_MS}ms` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative mix-blend asset, not content */}
        <img src="/ares/face.jpg" alt="" className={FACE_IMAGE_CLASS} />

        <div
          className="absolute inset-0 animate-[ares-head-idle_7s_ease-in-out_infinite]"
          style={{ maskImage: HEAD_MASK, WebkitMaskImage: HEAD_MASK }}
        >
          <div key={mouthPulse} className="absolute inset-0" style={reactiveStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative mix-blend asset, not content */}
            <img src="/ares/face.jpg" alt="" className={FACE_IMAGE_CLASS} />
          </div>
        </div>
      </div>
    </div>
  );
}
