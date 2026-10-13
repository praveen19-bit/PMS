/** Shared chart styling: violet gradient marks, quiet axes, glass tooltip. */
export const VIOLET = '#7F56F5'
export const VIOLET_SOFT = '#DACEFF'
export const AXIS = { fontSize: 11, fill: '#9E9CB6' }
export const GRID = '#ECEAF6'

/** Call inside a Recharts chart, then use `url(#<id>-bar)` / `url(#<id>-area)`. */
export function gradientDefs(id: string) {
  return (
    <defs>
      <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9D7BFF" />
        <stop offset="100%" stopColor="#6A3DE8" />
      </linearGradient>
      <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9D7BFF" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#9D7BFF" stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}

/** Violet bubble tooltip, like the kit's "highest value" callout. */
export function ChartTooltip({ active, payload, label, suffix = '' }: { active?: boolean; payload?: { value: number }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-grad rounded-2xl px-3 py-2 text-white shadow-glow">
      <p className="text-[10px] opacity-80">{label}</p>
      <p className="text-base font-semibold tabular-nums leading-tight">{payload[0]!.value}{suffix}</p>
    </div>
  )
}

/** Violet value bubble above the highlighted mark (Recharts custom label). */
export function ChipLabel(props: { x?: number; y?: number; width?: number; value?: number | string; index?: number; highlight: number; suffix?: string }) {
  const { x = 0, y = 0, width = 0, value, index, highlight, suffix = '' } = props
  if (index !== highlight) return null
  const text = `${value}${suffix}`
  const w = text.length * 6.6 + 16
  return (
    <g transform={`translate(${x + width / 2 - w / 2}, ${y - 28})`}>
      <rect width={w} height={20} rx={7} fill="#6A3DE8" />
      <text x={w / 2} y={14} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">{text}</text>
    </g>
  )
}
