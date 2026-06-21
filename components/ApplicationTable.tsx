'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { JobApplication, Status } from '@/types'
import StatusBadge from './StatusBadge'
import ApplicationForm from './ApplicationForm'
import { formatDate } from '../utils/DateFormat'
import { updateApplication, deleteApplication } from '@/lib/queries'

const STATUSES: Status[] = ['applied', 'screening', 'interview', 'technical', 'offer', 'rejected', 'ghosted', 'withdrawn']

export default function ApplicationTable({
  initial,
  total,
  page,
  pageSize,
  onPageChange,
  onRefresh,
}: {
  initial: JobApplication[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onRefresh?: () => void
}) {
  const [apps, setApps] = useState(initial)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [detail, setDetail] = useState<JobApplication | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setApps(initial) }, [initial])

  const totalPages = Math.ceil(total / pageSize)

  const filtered = apps.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter
    const matchSearch =
      a.job_title.toLowerCase().includes(search.toLowerCase()) ||
      a.company.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleUpdate(data: Omit<JobApplication, 'id' | 'user_id' | 'created_at'>) {
    if (!editing) return
    await updateApplication(editing.id, data)
    setEditing(null)
    onRefresh?.()
  }

  async function handleStatusChange(app: JobApplication, status: Status) {
    await updateApplication(app.id, { ...app, status })
    onRefresh?.()
  }

  async function handleDelete(id: string) {
    await deleteApplication(id)
    setDeleting(null)
    setDetail(null)
    onRefresh?.()
  }

  // ── Detail modal ──
  const detailModal = detail && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)} />
      <div className="relative bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden">

        {/* Header strip */}
        <div className="bg-indigo-50 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-jakarta font-extrabold text-lg text-[#0F172A] leading-tight">{detail.job_title}</p>
              <p className="text-sm text-slate-400 mt-0.5">{detail.company}</p>
            </div>
            <button onClick={() => setDetail(null)} className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Applied date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Date applied</span>
            <span className="text-sm font-semibold text-[#0F172A]">{formatDate(detail.applied_at)}</span>
          </div>

          {/* Status — inline selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status</span>
            <select
              value={detail.status}
              onChange={e => {
                const s = e.target.value as Status
                setDetail(d => d ? { ...d, status: s } : d)
                handleStatusChange(detail, s)
              }}
              className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          {detail.note && (
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1.5">Note</span>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed border border-slate-100">
                {detail.note}
              </p>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={() => { setEditing(detail); setDetail(null) }}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 hover:border-indigo-200 hover:text-[#6366F1] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => setDeleting(detail.id)}
            className="flex-1 flex items-center justify-center gap-2 border border-red-100 text-red-400 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Delete
          </button>
        </div>

      </div>
    </div>,
    document.body
  ) : null

  // ── Delete confirm modal ──
  const deleteModal = deleting && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleting(null)} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2 className="font-jakarta font-bold text-base text-[#0F172A] mb-1">Delete application?</h2>
        <p className="text-sm text-slate-400 mb-5">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={() => setDeleting(null)}
            className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDelete(deleting)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div>
      {editing && (
        <ApplicationForm
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {detailModal}
      {deleteModal}

      {/* ── Filters ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Search job or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 bg-white rounded-xl pl-8 pr-4 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as Status | 'all')}
          className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-14 flex flex-col items-center justify-center text-center gap-4">
          <img
            src="/empty-fox.png"
            alt="No applications"
            className="w-44 h-44 object-contain"
          />
          <div>
            <p className="font-jakarta font-extrabold text-lg text-[#0F172A] mb-1">
              No applications yet
            </p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Start tracking your job applications to stay organized.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(app => (
            <div
              key={app.id}
              onClick={() => setDetail(app)}
              className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-sm transition-all group cursor-pointer"
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

              {/* Inline status selector */}
              <div onClick={e => e.stopPropagation()}>
                <select
                  value={app.status}
                  onChange={e => handleStatusChange(app, e.target.value as Status)}
                  className="border border-slate-100 bg-slate-50 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-200 hover:border-indigo-200 transition cursor-pointer"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setEditing(app)}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-400 hover:text-[#6366F1] hover:border-indigo-200 hover:bg-indigo-50 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setDeleting(app.id)}
                  className="flex items-center gap-1.5 border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 px-1">
          <p className="text-xs text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-500">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-500">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-indigo-200 hover:text-[#6366F1] hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-400 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-indigo-200 hover:text-[#6366F1] hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

    </div>
  )
}