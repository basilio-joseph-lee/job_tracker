'use client'
import { useState, useEffect, useRef } from 'react'
import { getMonthlyStats } from '@/lib/queries'
import type { JobApplication, Status } from '@/types'
import { formatDate } from '@/utils/DateFormat'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: Status[] = [
  'applied', 'screening', 'interview', 'technical',
  'offer', 'rejected', 'ghosted', 'withdrawn',
]

const STATUS_COLORS: Record<Status, string> = {
  applied:   'bg-indigo-400',
  screening: 'bg-blue-400',
  interview: 'bg-violet-500',
  technical: 'bg-purple-500',
  offer:     'bg-emerald-500',
  rejected:  'bg-red-400',
  ghosted:   'bg-slate-300',
  withdrawn: 'bg-orange-400',
}

/** Hex colours used by the SVG charts (must stay in sync with STATUS_COLORS intent) */
const STATUS_HEX: Record<Status, string> = {
  applied:   '#818CF8',
  screening: '#60A5FA',
  interview: '#8B5CF6',
  technical: '#A855F7',
  offer:     '#10B981',
  rejected:  '#F87171',
  ghosted:   '#CBD5E1',
  withdrawn: '#FB923C',
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useStagger(count: number, delayMs = 80) {
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false))
  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < count; i++) {
      timers.push(setTimeout(() => {
        if (!cancelled) setVisible(v => v.map((b, idx) => idx === i ? true : b))
      }, i * delayMs))
    }
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [count, delayMs])
  return visible
}

/** Returns the Monday–Sunday week boundaries for a given Date */
function getWeekBounds(d: Date) {
  const day = d.getDay() // 0=Sun
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { mon, sun }
}

function isoToDate(iso: string) {
  // applied_at is assumed to be "YYYY-MM-DD"
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─── Animated SVG Bar Chart ───────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  animate: boolean
}

function BarChart({ data, color = '#6366F1', animate }: BarChartProps) {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) return
    let start: number | null = null
    const duration = 700
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      // ease-out cubic
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [animate])

  const W = 560
  const H = 180
  const PAD = { top: 16, right: 16, bottom: 32, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.min(32, (chartW / data.length) * 0.55)
  const gap = chartW / data.length

  // Y-axis ticks
  const ticks = Array.from(new Set([0, Math.ceil(max / 2), max]))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Y grid + ticks */}
      {ticks.map(t => {
        const y = PAD.top + chartH - (t / max) * chartH
        return (
          <g key={t}>
            <line
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="#E2E8F0" strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={y + 4}
              fontSize="9" textAnchor="end" fill="#94A3B8"
            >{t}</text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = ((d.value / max) * chartH) * progress
        const x = PAD.left + i * gap + gap / 2 - barW / 2
        const y = PAD.top + chartH - barH
        return (
          <g key={d.label}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx={4} ry={4}
              fill={color}
              opacity={d.value === 0 ? 0.15 : 0.85}
            />
            {/* value label above bar */}
            {d.value > 0 && (
              <text
                x={x + barW / 2} y={y - 4}
                fontSize="9" textAnchor="middle"
                fill="#6366F1" fontWeight="600"
                opacity={progress}
              >{d.value}</text>
            )}
            {/* x label */}
            <text
              x={x + barW / 2}
              y={PAD.top + chartH + 16}
              fontSize="9" textAnchor="middle" fill="#94A3B8"
            >{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Animated SVG Pie Chart ───────────────────────────────────────────────────

interface PieSlice { label: string; value: number; color: string }

function PieChart({ slices, animate }: { slices: PieSlice[]; animate: boolean }) {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) return
    let start: number | null = null
    const duration = 900
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [animate])

  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return <p className="text-sm text-slate-400">No data yet.</p>

  const CX = 120, CY = 120, R = 100, IR = 58

  // Build arc paths
  let cumAngle = -Math.PI / 2
  const paths = slices.map(sl => {
    const frac = (sl.value / total) * progress
    const startA = cumAngle
    const endA = cumAngle + frac * 2 * Math.PI
    cumAngle = endA

    const x1 = CX + R * Math.cos(startA), y1 = CY + R * Math.sin(startA)
    const x2 = CX + R * Math.cos(endA),   y2 = CY + R * Math.sin(endA)
    const ix1 = CX + IR * Math.cos(startA), iy1 = CY + IR * Math.sin(startA)
    const ix2 = CX + IR * Math.cos(endA),   iy2 = CY + IR * Math.sin(endA)

    const large = frac * 2 * Math.PI > Math.PI ? 1 : 0

    const d = frac < 0.001 ? '' : [
      `M ${ix1} ${iy1}`,
      `L ${x1} ${y1}`,
      `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${IR} ${IR} 0 ${large} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ')

    return { d, color: sl.color, value: sl.value, label: sl.label }
  })

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* Donut */}
      <svg viewBox="0 0 240 240" className="w-56 h-56 shrink-0">
        {paths.map((p, i) => p.d && (
          <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="1.5" />
        ))}
        {/* Center label */}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0F172A">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="8" fill="#94A3B8">total</text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.filter(sl => sl.value > 0).map(sl => (
          <div key={sl.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sl.color }} />
            <span className="text-xs text-slate-500 capitalize truncate">{sl.label}</span>
            <span className="ml-auto text-xs font-semibold text-slate-600 shrink-0">
              {sl.value} <span className="text-slate-400 font-normal">({Math.round((sl.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-row components (unchanged logic, preserved) ─────────────────────────

function StatusRow({ status, count, total, color, index }: {
  status: string; count: number; total: number; color: string; index: number
}) {
  const [show, setShow] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), index * 60)
    const t2 = setTimeout(() => setBarWidth(Math.round((count / total) * 100)), index * 60 + 100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [index, count, total])
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }} className="flex items-center gap-3">
      <span className="text-xs text-slate-500 font-medium capitalize w-24 shrink-0">{status}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${barWidth}%`, transition: 'width 0.7s ease' }} />
      </div>
      <span className="text-xs text-slate-400 font-semibold w-4 text-right">{count}</span>
    </div>
  )
}

function DayRow({ date, count, max, index }: {
  date: string; count: number; max: number; index: number
}) {
  const [show, setShow] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), index * 60)
    const t2 = setTimeout(() => setBarWidth(Math.round((count / max) * 100)), index * 60 + 100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [index, count, max])
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }} className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 shrink-0">{formatDate(date)}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="bg-[#6366F1] h-2 rounded-full" style={{ width: `${barWidth}%`, transition: 'width 0.7s ease' }} />
      </div>
      <span className="text-xs text-slate-400 font-semibold w-4 text-right">{count}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TOTAL_BLOCKS = 5 // header, filters, stats, charts

export default function AnalyticsPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1) // 1-based
  const [apps, setApps]   = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [chartsReady, setChartsReady] = useState(false)
  const visible = useStagger(TOTAL_BLOCKS, 90)

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  useEffect(() => {
    setLoading(true)
    setChartsReady(false)
    getMonthlyStats(selectedYear, selectedMonth).then(data => {
      setApps(data)
      setLoading(false)
      // slight delay so the card fades in before bars animate
      setTimeout(() => setChartsReady(true), 300)
    })
  }, [selectedYear, selectedMonth])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const interviews   = apps.filter(a => ['interview', 'technical'].includes(a.status)).length
  const responseRate = apps.length > 0 ? Math.round((interviews / apps.length) * 100) : 0

  const byStatus = STATUSES.map(s => ({
    status: s,
    count: apps.filter(a => a.status === s).length,
  })).filter(s => s.count > 0)

  const byDay: Record<string, number> = {}
  apps.forEach(a => { byDay[a.applied_at] = (byDay[a.applied_at] || 0) + 1 })
  const maxDay = Math.max(...Object.values(byDay), 1)

  // ── Weekly bar chart data (Mon–Sun of the current week in selected month) ──
  const refDate = new Date(selectedYear, selectedMonth - 1, now.getDate())
  const { mon, sun } = getWeekBounds(refDate)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return { label: DAYS_SHORT[(i + 1) % 7], value: byDay[iso] ?? 0, date: iso }
  })

  // ── Pie chart slices ───────────────────────────────────────────────────────
  const pieSlices: PieSlice[] = STATUSES.map(s => ({
    label: s,
    value: apps.filter(a => a.status === s).length,
    color: STATUS_HEX[s],
  })).filter(sl => sl.value > 0)

  const s = (i: number) => ({
    opacity: visible[i] ? 1 : 0,
    transform: visible[i] ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  return (
    <div className="max-w-3xl mx-auto px-2">

      {/* ── BLOCK 0: Header ── */}
      <div
  style={s(0)}
  className="flex items-start justify-between mb-6"
>
  {/* Left */}
  <div>
    <p className="text-slate-400 text-sm font-medium">
      {MONTHS[selectedMonth - 1]} {selectedYear}
    </p>

    <h1 className="font-jakarta font-extrabold text-2xl text-[#0F172A] tracking-tight mt-0.5">
      Analytics
    </h1>
  </div>

 <div className="flex flex-col gap-3">
  {/* Month */}
  <div className="grid grid-cols-[50px_110px] items-center gap-3">
    <label className="text-xs text-slate-400 font-medium">
      Month
    </label>

    <select
      value={selectedMonth}
      onChange={e => setSelectedMonth(Number(e.target.value))}
      className="w-[110px] text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white"
    >
      {MONTHS.map((m, i) => (
        <option key={m} value={i + 1}>
          {m}
        </option>
      ))}
    </select>
  </div>

  {/* Year */}
  <div className="grid grid-cols-[50px_110px] items-center gap-3">
    <label className="text-xs text-slate-400 font-medium">
      Year
    </label>

    <select
      value={selectedYear}
      onChange={e => setSelectedYear(Number(e.target.value))}
      className="w-[110px] text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white"
    >
      {yearOptions.map(y => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  </div>
</div>
</div>

      {/* ── BLOCK 2: Stats ── */}
      <div style={s(2)} className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Applied this month', value: apps.length,        color: 'text-[#0F172A]', bg: 'bg-slate-50' },
          { label: 'Interviews',         value: interviews,         color: 'text-[#6366F1]', bg: 'bg-indigo-50' },
          { label: 'Response rate',      value: `${responseRate}%`, color: 'text-[#6366F1]', bg: 'bg-indigo-50' },
        ].map(stat => (
          <div
            key={stat.label}
            className={`${stat.bg} border border-slate-200 rounded-2xl p-5 text-center hover:border-indigo-200 hover:shadow-sm transition-all`}
          >
            <p className={`font-jakarta font-extrabold text-3xl ${stat.color}`}>
              {loading
                ? <span className="inline-block w-10 h-7 bg-slate-200 rounded animate-pulse" />
                : stat.value}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── BLOCK 4: Weekly Bar Chart + Monthly Pie Chart ── */}
      <div style={s(4)} className="space-y-4">

        {/* Bar chart */}
        <div className="bg-white border border-slate-200 rounded-2xl px-5 pt-4 pb-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-jakarta font-bold text-sm text-[#0F172A]">This week</h2>
            <span className="text-xs text-slate-400">
              {mon.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              {' – '}
              {sun.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
            </span>
          </div>
            {loading ? (
              <div className="h-[180px] flex items-end gap-2 px-2 pb-6">
                {[60, 90, 40, 110, 70, 100, 50].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-100 rounded animate-pulse"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            ) : (
              <BarChart data={weekData} animate={chartsReady} />
            )}
        </div>

        {/* Pie chart */}
       {/* Monthly Breakdown + Application Sources */}
<div className="grid grid-cols-1 lg:grid-cols-10 gap-4">

  {/* Monthly Breakdown - 70% */}
  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl px-5 pt-4 pb-5">
    <h2 className="font-jakarta font-bold text-sm text-[#0F172A] mb-4">
      Monthly Breakdown
    </h2>

    {loading ? (
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse" />
        <div className="flex flex-col gap-2 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-2 flex-1 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ) : (
      <PieChart slices={pieSlices} animate={chartsReady} />
    )}
  </div>

  {/* Application Sources - 30% */}
  <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl px-5 pt-4 pb-5">
    <h2 className="font-jakarta font-bold text-sm text-[#0F172A] mb-4">
      Application Sources
    </h2>

    <div className="space-y-4">
      {[
        { source: 'LinkedIn', count: 0 },
        { source: 'JobStreet', count: 0 },
        { source: 'Indeed', count: 0 },
        { source: 'Others', count: 0 },
      ].map(item => (
        <div key={item.source}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">{item.source}</span>
            <span className="font-semibold text-slate-700">{item.count}</span>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-indigo-400 rounded-full"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-5 pt-4 border-t border-slate-100">
      <p className="text-xs text-slate-400 text-center">
        Source tracking coming soon
      </p>
    </div>
  </div>

</div>

      </div>

    </div>
  )
}
