import Link from "next/link";
import { Starfield } from "@/components/ares/starfield";

// Same timing as the image's own float animation (minus the brightness
// pulse) — applied separately to the button layer so the hitboxes track the
// image without a transformed ancestor sitting between the image and the
// starfield, which would cut off its mix-blend-mode (see the image below).
const FLOAT_SYNC = "hero-float 8s cubic-bezier(0.45, 0, 0.55, 1) infinite";

// Percentage bounding boxes over each island, calibrated against
// public/business/hero.webp — nudge these if a hitbox drifts off its island.
const ISLAND_LINKS = [
  { href: "/business/finance", label: "Finance", left: "1%", top: "3%", width: "29%", height: "44%" },
  { href: "/business/hub", label: "Hub", left: "27%", top: "14%", width: "46%", height: "84%" },
  { href: "/business/marketing", label: "Marketing", left: "70%", top: "3%", width: "29%", height: "44%" },
];

export default function BusinessPage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black px-44 py-24">
      <Starfield />

      {/* Soft spotlights in the empty space above the islands. */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(242,242,242,0.16), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(242,242,242,0.16), transparent 70%)" }}
      />

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {/* Aspect-locked to the image's own 3:2 ratio so the button
            percentages below line up with the actual islands regardless of
            container size. */}
        <div className="relative h-full max-h-full aspect-[3/2]">
          {/* Float animation lives on the same element as mix-blend-mode —
              putting it on a wrapper would give that wrapper its own
              transform-triggered stacking context and cut the blend off
              from the starfield behind it, which caused a visible black
              box before. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- static hero, not content that needs Next/Image optimization */}
          <img
            src="/business/hero.webp"
            alt=""
            className="h-full w-full object-contain"
            style={{
              mixBlendMode: "screen",
              willChange: "transform, filter",
              animation: `${FLOAT_SYNC}, hero-lights-pulse 3.4s ease-in-out infinite`,
            }}
          />

          {ISLAND_LINKS.map((island) => (
            <Link
              key={island.href}
              href={island.href}
              aria-label={island.label}
              className="absolute"
              style={{ left: island.left, top: island.top, width: island.width, height: island.height, animation: FLOAT_SYNC }}
            >
              <div className="h-full w-full rounded-[30%] transition-all duration-300 hover:scale-[1.04] hover:bg-white/5 hover:shadow-[0_0_60px_rgba(255,255,255,0.35)]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
