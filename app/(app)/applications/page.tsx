'use client'
import { useState, useEffect } from 'react'
import { getApplications } from '@/lib/queries'
import ApplicationTable from '@/components/ApplicationTable'
import AddButton from '@/components/AddButton'
import type { JobApplication } from '@/types'

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

const TOTAL_BLOCKS = 2 // header, filters+table skeleton, table

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const visible = useStagger(TOTAL_BLOCKS, 90)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5


  async function fetchApps(p = page) {
    setLoading(true)
    const { data, total } = await getApplications(p, PAGE_SIZE)
    setApps(data)
    setTotal(total)
    setLoading(false)
  }


  useEffect(() => { fetchApps(page) }, [page])

  const s = (i: number) => ({
    opacity: visible[i] ? 1 : 0,
    transform: visible[i] ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  return (
    <div className="max-w-3xl mx-auto px-2">

      {/* ── BLOCK 0: Header ── */}
      <div style={s(0)} className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium">Manage your</p>
          <h1 className="font-jakarta font-extrabold text-2xl text-[#0F172A] tracking-tight mt-0.5">
            Applications
          </h1>
        </div>
        <AddButton onAdded={fetchApps} />
      </div>



      {/* ── BLOCK 2: Table ── */}
      <div style={s(1)}>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 animate-pulse">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-slate-100 rounded w-2/5 mb-2" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                  <div className="flex gap-2">
                    <div className="h-7 w-14 bg-slate-100 rounded-xl" />
                    <div className="h-7 w-14 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ApplicationTable
            initial={apps}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onRefresh={() => fetchApps(page)}
          />
        )}
      </div>

    </div>
  )
}