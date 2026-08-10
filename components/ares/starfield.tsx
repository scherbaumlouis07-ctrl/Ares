const STAR_COUNT = 140;

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const STARS = (() => {
  const rand = seededRandom(7);
  return Array.from({ length: STAR_COUNT }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: rand() < 0.85 ? 1 : 1.6,
    opacity: 0.15 + rand() * 0.5,
  }));
})();

/** Deterministic star positions (seeded, not Math.random()) so server and client render identically. */
export function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-text"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
