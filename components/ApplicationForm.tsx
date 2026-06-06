'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { JobApplication, Status } from '@/types'

const STATUSES: Status[] = ['applied', 'screening', 'interview', 'technical', 'offer', 'rejected', 'ghosted', 'withdrawn']

type Props = {
  initial?: Partial<JobApplication>
  onSubmit: (data: Omit<JobApplication, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  onCancel: () => void
}

export default function ApplicationForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    job_title:   initial?.job_title   ?? '',
    company:     initial?.company     ?? '',
    description: initial?.description ?? '',
    job_url:     initial?.job_url     ?? '',
    applied_at:  initial?.applied_at  ?? new Date().toISOString().split('T')[0],
    status:      initial?.status      ?? 'applied' as Status,
    note:        initial?.note        ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Wait for client mount before using portal
  useEffect(() => {
    setMounted(true)
    // Prevent body scroll while modal open
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.job_title || !form.company) return
    setLoading(true)
    await onSubmit({
      ...form,
      description: form.description || null,
      job_url:     form.job_url     || null,
      note:        form.note        || null,
    })
    setLoading(false)
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-jakarta font-bold text-base text-[#0F172A]">
            {initial?.job_title ? 'Edit application' : 'Add application'}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-300 hover:text-slate-500 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job title *</label>
              <input
                placeholder="e.g. Frontend Engineer"
                value={form.job_title}
                onChange={e => set('job_title', e.target.value)}
                className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company *</label>
              <input
                placeholder="e.g. Stripe"
                value={form.company}
                onChange={e => set('company', e.target.value)}
                className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date applied</label>
              <input
                type="date"
                value={form.applied_at}
                onChange={e => set('applied_at', e.target.value)}
                className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job URL</label>
            <input
              placeholder="https://..."
              value={form.job_url}
              onChange={e => set('job_url', e.target.value)}
              className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <textarea
              placeholder="Job description or key details..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
            <textarea
              placeholder="Personal notes, follow-up reminders..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={2}
              className="w-full border border-slate-200 bg-[#F8FAFC] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.job_title || !form.company}
            className="flex-1 bg-[#6366F1] hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-jakarta font-bold transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  )

  // Render into document.body via portal to escape any stacking context
  if (!mounted) return null
  return createPortal(modal, document.body)
}