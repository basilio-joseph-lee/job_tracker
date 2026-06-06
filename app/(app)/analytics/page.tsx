'use client'
import { useState, useEffect } from 'react'
import { getMonthlyStats } from '@/lib/queries'
import type { JobApplication, Status } from '@/types'

const STATUSES: Status[] = ['applied','screening','interview','technical','offer','rejected','ghosted','withdrawn']

const STATUS_COLORS: Record<Status, string> = {
  applied:    'bg-indigo-400',
  screening:  'bg-blue-400',
  interview:  'bg-violet-500',
  technical:  'bg-purple-500',
  offer:      'bg-emerald-500',
  rejected:   'bg-red-400',
  ghosted:    'bg-slate-300',
  withdrawn:  'bg-orange-400',
}

function useStagger(count: number, delayMs = 80) {
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false))
  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          if (!cancelled) setVisible(v => v.map((b, idx) => idx === i ? true : b))
        }, i * delayMs)
      )
    }
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [count, delayMs])
  return visible
}

const TOTAL_BLOCKS = 5 // header, stats, status chart, divider, daily chart

export default function AnalyticsPage() {
  const [apps, setApps] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const visible = useStagger(TOTAL_BLOCKS, 90)

  useEffect(() => {
    getMonthlyStats(now.getFullYear(), now.getMonth() + 1).then(data => {
      setApps(data)
      setLoading(false)
    })
  }, [])

  const interviews = apps.filter(a => ['interview', 'technical'].includes(a.status)).length
  const offers = apps.filter(a => a.status === 'offer').length
  const responseRate = apps.length > 0 ? Math.round((interviews / apps.length) * 100) : 0

  const byStatus = STATUSES.map(s => ({
    status: s,
    count: apps.filter(a => a.status === s).length
  })).filter(s => s.count > 0)

  const byDay: Record<string, number> = {}
  apps.forEach(a => {
    byDay[a.applied_at] = (byDay[a.applied_at] || 0) + 1
  })

  const maxDay = Math.max(...Object.values(byDay), 1)

  const s = (i: number) => ({
    opacity: visible[i] ? 1 : 0,
    transform: visible[i] ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  return (
    <div className="max-w-3xl mx-auto px-2">

      {/* ── BLOCK 0: Header ── */}
      <div style={s(0)} className="mb-8">
        <p className="text-slate-400 text-sm font-medium">
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
        <h1 className="font-jakarta font-extrabold text-2xl text-[#0F172A] tracking-tight mt-0.5">
          Analytics
        </h1>
      </div>

      {/* ── BLOCK 1: Stats ── */}
      <div style={s(1)} className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Applied this month', value: apps.length,    color: 'text-[#0F172A]', bg: 'bg-slate-50' },
          { label: 'Interviews',         value: interviews,     color: 'text-[#6366F1]', bg: 'bg-indigo-50' },
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

      {/* ── BLOCK 2: By status ── */}
      <div style={s(2)} className="bg-white border border-slate-200 rounded-2xl px-5 pt-4 pb-5 mb-4">
        <h2 className="font-jakarta font-bold text-sm text-[#0F172A] mb-4">By status</h2>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full animate-pulse" />
                <div className="w-4 h-3 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : byStatus.length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {byStatus.map(({ status, count }, i) => (
              <StatusRow
                key={status}
                status={status}
                count={count}
                total={apps.length}
                color={STATUS_COLORS[status]}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── BLOCK 3: Divider ── */}
      <div style={s(3)} className="border-t border-slate-100 my-4" />

      {/* ── BLOCK 4: Applications per day ── */}
      <div style={s(4)} className="bg-white border border-slate-200 rounded-2xl px-5 pt-4 pb-5 mb-8">
        <h2 className="font-jakarta font-bold text-sm text-[#0F172A] mb-4">Applications per day</h2>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full animate-pulse" />
                <div className="w-4 h-3 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : Object.keys(byDay).length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(byDay).sort().map(([date, count], i) => (
              <DayRow key={date} date={date} count={count} max={maxDay} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function StatusRow({ status, count, total, color, index }: {
  status: string
  count: number
  total: number
  color: string
  index: number
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
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: `${barWidth}%`, transition: 'width 0.7s ease' }}
        />
      </div>
      <span className="text-xs text-slate-400 font-semibold w-4 text-right">{count}</span>
    </div>
  )
}

function DayRow({ date, count, max, index }: {
  date: string
  count: number
  max: number
  index: number
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
      <span className="text-xs text-slate-400 w-24 shrink-0">{date}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-[#6366F1] h-2 rounded-full"
          style={{ width: `${barWidth}%`, transition: 'width 0.7s ease' }}
        />
      </div>
      <span className="text-xs text-slate-400 font-semibold w-4 text-right">{count}</span>
    </div>
  )
}