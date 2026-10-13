/** Shared chart styling: hatched fills, lime highlight, quiet axes, glass tooltip. */
export const LIME = '#D4F25C'
export const INK = '#111214'
export const AXIS = { fontSize: 11, fill: '#8D9097' }
export const GRID = 'rgba(17,18,20,0.06)'

/** Call inside a Recharts chart: `{hatchDefs('x')}` then `fill="url(#x)"`. */
export function hatchDefs(id: string) {
  return (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
        <rect width="7" height="7" fill="rgba(255,255,255,0.55)" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(17,18,20,0.32)" strokeWidth="1.4" />
      </pattern>
    </defs>
  )
}

export function ChartTooltip({ active, payload, label, suffix = '' }: { active?: boolean; payload?: { value: number }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-2xl px-3 py-2 text-xs">
      <p className="font-medium text-ink">{label}</p>
      <p className="tabular-nums text-ink-soft">{payload[0]!.value}{suffix}</p>
    </div>
  )
}

/** Lime value chip rendered above the highlighted bar (Recharts custom label). */
export function ChipLabel(props: { x?: number; y?: number; width?: number; value?: number | string; index?: number; highlight: number; suffix?: string }) {
  const { x = 0, y = 0, width = 0, value, index, highlight, suffix = '' } = props
  if (index !== highlight) return null
  const text = `${value}${suffix}`
  const w = text.length * 6.4 + 14
  return (
    <g transform={`translate(${x + width / 2 - w / 2}, ${y - 26})`}>
      <rect width={w} height={19} rx={6} fill={LIME} />
      <text x={w / 2} y={13} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#2F3A05">{text}</text>
    </g>
  )
}
