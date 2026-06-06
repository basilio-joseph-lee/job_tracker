'use client'
import { useState } from 'react'
import ApplicationForm from './ApplicationForm'
import { addApplication } from '@/lib/queries'
import type { JobApplication } from '@/types'

export default function AddButton({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)

  async function handleAdd(data: Omit<JobApplication, 'id' | 'user_id' | 'created_at'>) {
    await addApplication(data)
    setOpen(false)
    onAdded()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#6366F1] hover:bg-indigo-500 text-white font-jakarta font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add application
      </button>

      {/* Portal-based modal — renders outside any stacking context */}
      {open && (
        <ApplicationForm
          onSubmit={handleAdd}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}