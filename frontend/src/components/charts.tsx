import { useTheme } from '@/hooks/useTheme'

/** Chart colours per theme (SVG attributes can't read CSS variables). */
const PALETTE = {
  dark: {
    primary: '#A78BFA', primaryStrong: '#8B5CF6', soft: '#3B2D72', grid: '#222B47', axis: '#8A93AD', accent: '#F472B6',
    success: '#34D399', warning: '#FBBF24', danger: '#F87171', dotFill: '#141B2E', cursor: 'rgba(167,139,250,0.08)',
  },
  light: {
    primary: '#8B5CF6', primaryStrong: '#7C3AED', soft: '#DDD6FE', grid: '#E5E7EB', axis: '#6B7280', accent: '#EC4899',
    success: '#10B981', warning: '#D97706', danger: '#DC2626', dotFill: '#FFFFFF', cursor: 'rgba(139,92,246,0.06)',
  },
}

export function useChartColors() {
  const { theme } = useTheme()
  const c = PALETTE[theme]
  return { ...c, axisTick: { fontSize: 11, fill: c.axis } }
}

/** Call inside a Recharts chart, then use `url(#<id>-bar)` / `url(#<id>-area)`. */
export function gradientDefs(id: string) {
  return (
    <defs>
      <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}

export function ChartTooltip({ active, payload, label, suffix = '' }: { active?: boolean; payload?: { value: number }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-3 py-2">
      <p className="text-[10px] text-ink-mute">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-ink">{payload[0]!.value}{suffix}</p>
    </div>
  )
}

/** Value chip above the highlighted mark (Recharts custom label). */
export function ChipLabel(props: { x?: number; y?: number; width?: number; value?: number | string; index?: number; highlight: number; suffix?: string; fill?: string }) {
  const { x = 0, y = 0, width = 0, value, index, highlight, suffix = '', fill = '#10B981' } = props
  if (index !== highlight) return null
  const text = `${value}${suffix}`
  const w = text.length * 6.6 + 16
  return (
    <g transform={`translate(${x + width / 2 - w / 2}, ${y - 28})`}>
      <rect width={w} height={20} rx={6} fill={fill} />
      <text x={w / 2} y={14} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">{text}</text>
    </g>
  )
}
