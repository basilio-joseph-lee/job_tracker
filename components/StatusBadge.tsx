import type { Status } from '@/types'

const statusStyles: Record<Status, string> = {
  applied:   'bg-indigo-50 text-indigo-600',
  screening: 'bg-blue-50 text-blue-600',
  interview: 'bg-amber-50 text-amber-600',
  technical: 'bg-orange-50 text-orange-600',
  offer:     'bg-emerald-50 text-emerald-600',
  rejected:  'bg-red-50 text-red-500',
  ghosted:   'bg-slate-100 text-slate-400',
  withdrawn: 'bg-slate-100 text-slate-400',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize font-inter ${statusStyles[status]}`}>
      {status}
    </span>
  )
}