'use client'
import { useState, useEffect } from 'react'
import { getApplications } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import GoalProgressBar from '@/components/GoalProgressBar'
import StatusBadge from '@/components/StatusBadge'
import AddButton from '@/components/AddButton'
import type { JobApplication } from '@/types'
import { formatDate } from '@/utils/DateFormat'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Hook: staggered reveal on mount
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

function useMaxRows(rowHeightPx = 72, reservedPx = 520) {
  const [maxRows, setMaxRows] = useState(3)
  useEffect(() => {
    function calc() {
      const available = window.innerHeight - reservedPx
      const rows = Math.max(1, Math.floor(available / rowHeightPx))
      setMaxRows(rows)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return maxRows
}

const TOTAL_BLOCKS = 6 // header, goal, stats, divider, recent-header, recent-list

export default function DashboardPage() {
  const [apps, setApps] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const visible = useStagger(TOTAL_BLOCKS, 90)

  async function fetchApps() {
    const { data } = await getApplications(1, 5)
    setApps(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchApps()
    // Get user email for greeting
    createClient().auth.getUser().then(({ data }) => {
      const email = data?.user?.email ?? ''
      // Use part before @ as display name, capitalize first letter
      const name = email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayCount = apps.filter(a => a.applied_at === today).length
  const interviews = apps.filter(a => ['interview', 'technical'].includes(a.status)).length
  const offers = apps.filter(a => a.status === 'offer').length
  const maxRows = useMaxRows()
  const recent = apps.slice(0, maxRows)

  const stats = [
    { label: 'Total applied', value: apps.length,  color: 'text-[#0F172A]',  bg: 'bg-slate-50' },
    { label: 'Interviews',    value: interviews,    color: 'text-[#6366F1]',  bg: 'bg-indigo-50' },
    { label: 'Offers',        value: offers,        color: 'text-[#6366F1]',  bg: 'bg-indigo-50' },
  ]

  // Shared stagger style helper
  const s = (i: number) => ({
    opacity: visible[i] ? 1 : 0,
    transform: visible[i] ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  return (
    <div className="max-w-3xl mx-auto px-2">

      {/* ── BLOCK 0: Header + greeting + Add button ── */}
      <div style={s(0)} className="flex items-start justify-between gap-4 mb-8 flex-wrap">

      <div>
        <p className="text-slate-400 text-sm font-medium">
          {getGreeting() === 'Good morning' ? '🌅' : getGreeting() === 'Good afternoon' ? '🌤' : '🌙'} {getGreeting()}
        </p>
        <h1 className="font-jakarta font-extrabold text-2xl text-[#0F172A] tracking-tight mt-0.5">
          Welcome back,{' '}
          <span className="text-[#6366F1]">{userName ? userName : 'there'}</span>
        </h1>
      </div>
        <AddButton onAdded={fetchApps} />
      </div>

      {/* ── BLOCK 1: Goal progress ── */}
      <div style={s(1)}>
        <GoalProgressBar todayCount={todayCount} userName={userName} totalApps={apps.length} /> 
      </div>

      {/* ── BLOCK 2: Stats ── */}
      <div style={s(2)} className="grid grid-cols-3 gap-4 mt-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`${stat.bg} border border-slate-200 rounded-2xl p-5 text-center hover:border-indigo-200 hover:shadow-sm transition-all`}
          >
            <p className={`font-jakarta font-extrabold text-3xl ${stat.color}`}>
              {loading ? (
                <span className="inline-block w-8 h-7 bg-slate-200 rounded animate-pulse" />
              ) : stat.value}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── BLOCK 3: Divider ── */}
      <div style={s(3)} className="border-t border-slate-100 mt-8" />

      {/* ── BLOCK 4: Recent header ── */}
      <div style={s(4)} className="flex items-center justify-between mt-6 mb-4">
        <h2 className="font-jakarta font-bold text-sm text-slate-500 uppercase tracking-wider">
          Recent applications
        </h2>
        <a href="/applications" className="text-xs text-[#6366F1] font-semibold hover:underline">
          View all →
        </a>
      </div>

      {/* ── BLOCK 5: Recent list ── */}
      <div style={s(5)} className="pb-20">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 animate-pulse">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-slate-100 rounded w-2/5 mb-2" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
) : recent.length === 0 ? (
  <div className="bg-white border border-slate-200 border-dashed rounded-2xl px-5 py-14 text-center">
    <p className="text-3xl mb-3">📋</p>
    <p className="text-sm font-jakarta font-bold text-slate-400">No applications yet</p>
    <p className="text-xs text-slate-300 mt-1">Add your first application to get started</p>
  </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((app, i) => (
              <RecentRow key={app.id} app={app} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// Individual row with its own micro stagger on mount
function RecentRow({ app, index }: { app: JobApplication; index: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), index * 60)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
      className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-sm transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-jakarta font-bold text-sm text-[#0F172A] truncate group-hover:text-[#6366F1] transition-colors">
          {app.job_title}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">
          {app.company}
          <span className="mx-1.5 text-slate-200">·</span>
          {formatDate(app.applied_at)}
        </p>
        {app.note && (
          <p className="text-xs text-slate-300 truncate mt-1">{app.note}</p>
        )}
      </div>
      <StatusBadge status={app.status} />
    </div>
  )
}