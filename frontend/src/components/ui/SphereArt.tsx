import { useId, useMemo } from 'react'

/** Seeded PRNG so the cluster is identical on every render. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

interface Sphere { x: number; y: number; r: number }

function buildCluster(seed: number): Sphere[] {
  const rand = rng(seed)
  const out: Sphere[] = []
  // Main cluster: a soft blob of glossy spheres, packed without heavy overlap.
  for (let tries = 0; out.length < 46 && tries < 4000; tries++) {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * 92
    const x = 190 + Math.cos(a) * d * 1.15
    const y = 92 + Math.sin(a) * d * 0.8
    const r = 9 + rand() * 11 - d * 0.04
    if (out.some((s) => Math.hypot(s.x - x, s.y - y) < (s.r + r) * 0.86)) continue
    out.push({ x, y, r })
  }
  // A trail of small spheres "dissolving" down and to the left.
  for (let i = 0; i < 70; i++) {
    const t = rand()
    const x = 120 - t * 110 + (rand() - 0.5) * 50
    const y = 120 + t * 120 + (rand() - 0.5) * 40
    out.push({ x, y, r: 1.2 + (1 - t) * 3.5 * rand() })
  }
  return out.sort((a, b) => a.y - b.y)
}

/** Decorative cluster of glossy lime spheres (pure SVG, no image assets). */
export function SphereArt({ seed = 7, className }: { seed?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const spheres = useMemo(() => buildCluster(seed), [seed])
  return (
    <svg viewBox="0 0 300 260" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FBFFE3" />
          <stop offset="22%" stopColor="#DDF57A" />
          <stop offset="60%" stopColor="#9CCB22" />
          <stop offset="100%" stopColor="#4C7410" />
        </radialGradient>
        <radialGradient id={`${id}-s`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#111214" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#111214" stopOpacity="0" />
        </radialGradient>
      </defs>
      {spheres.map((s, i) => (
        <g key={i}>
          {s.r > 6 && <ellipse cx={s.x + s.r * 0.25} cy={s.y + s.r * 0.95} rx={s.r * 0.9} ry={s.r * 0.35} fill={`url(#${id}-s)`} />}
          <circle cx={s.x} cy={s.y} r={s.r} fill={`url(#${id}-g)`} />
        </g>
      ))}
    </svg>
  )
}
