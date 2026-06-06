'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { foxMessages } from '@/lib/foxMessages'

// ── Tweak fox size here ──────────────────
const FOX_IMG_HEIGHT = 400
const FOX_IMG_WIDTH  = 250
const FOX_CLIP       = 160
// ─────────────────────────────────────────

function getFoxMessage(todayCount: number, goal: number, totalApps: number): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  if (totalApps === 0) return pick(foxMessages.firstApplication)
  if (totalApps >= 100) return pick(foxMessages.milestone100)
  if (totalApps >= 50) return pick(foxMessages.milestone50)
  if (totalApps >= 25) return pick(foxMessages.milestone25)
  if (totalApps >= 10) return pick(foxMessages.milestone10)
  if (todayCount === 0) return pick(foxMessages.noApplicationsToday)
  if (todayCount >= goal) return pick(foxMessages.goalCompleted)
  if (todayCount > 0) return pick(foxMessages.goalInProgress)

  return pick(foxMessages.generalMotivation)
}

export default function GoalProgressBar({ todayCount, userName, totalApps }: {
  todayCount: number
  userName?: string
  totalApps: number
}) {
  const [goal, setGoal] = useState(5)
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('5')
  const [foxMessage, setFoxMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('daily_goal')
    if (saved) {
      setGoal(Number(saved))
      setInput(saved)
    }
  }, [])

  // Update message when counts change
  useEffect(() => {
    setFoxMessage(getFoxMessage(todayCount, goal, totalApps))
  }, [todayCount, goal, totalApps])

  function saveGoal() {
    const val = Math.max(1, Number(input) || 5)
    setGoal(val)
    localStorage.setItem('daily_goal', String(val))
    setEditing(false)
  }

  const percent = Math.min((todayCount / goal) * 100, 100)
  const done = todayCount >= goal

  return (
    <div className="relative">

      {/* ── TOP ROW: Fox (left) + Speech bubble (right) ── */}
      <div className="flex items-center gap-0 mb-0">

        {/* Fox — upper half only */}
        <div
          className="relative shrink-0"
          style={{
            width: FOX_IMG_WIDTH,
            height: FOX_CLIP,
            overflow: 'hidden',
            marginLeft: '-45px',
          }}
        >
          <Image
            src="/mascot.png"
            alt="Hirely mascot"
            width={FOX_IMG_WIDTH}
            height={FOX_IMG_HEIGHT}
            className="absolute top-0 left-0 object-contain object-top"
            style={{ width: FOX_IMG_WIDTH, height: FOX_IMG_HEIGHT }}
          />
        </div>

        {/* Speech bubble */}
        <div
          className="flex-1 relative bg-white border border-slate-200 rounded-4xl shadow-sm flex items-center px-6 py-5"
          style={{ marginLeft: '-40px', marginRight: '40px', minHeight: FOX_CLIP * 0.75 }}
        >
          {/* Triangle tail */}
          <div style={{
            position: 'absolute',
            bottom: 5,
            left: -4,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '18px solid white',
            transform: 'rotate(-80deg)',
            zIndex: 2,
          }} />
          {/* Tail border */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: -7,
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '17px solid transparent',
            borderTop: '20px solid #E2E8F0',
            transform: 'rotate(-80deg)',
            zIndex: 1,
          }} />

          <p className="text-lg text-slate-500 leading-relaxed text-center">
            {foxMessage.replace('🦊 ', '')}
          </p>
        </div>

      </div>

      {/* ── GOAL CARD ── */}
      <div className={`bg-white border rounded-2xl px-5 pt-4 pb-5 transition-colors ${done ? 'border-[#6366F1]' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-jakarta font-bold text-sm text-[#0F172A]">Today's goal</p>
            {done && (
              <p className="text-xs text-[#6366F1] font-medium mt-0.5">Goal reached! 🎯</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={input}
                  min={1}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveGoal()}
                  className="w-14 border border-indigo-300 rounded-lg px-2 py-1 text-xs text-center font-semibold outline-none focus:ring-2 focus:ring-indigo-200"
                  autoFocus
                />
                <button
                  onClick={saveGoal}
                  className="text-xs bg-[#6366F1] text-white px-2.5 py-1 rounded-lg font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="font-jakarta font-extrabold text-sm text-[#6366F1]">
                  {todayCount} / {goal} apps
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-slate-300 hover:text-slate-500 transition-colors ml-1"
                  title="Edit goal"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-700 bg-[#6366F1]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

    </div>
  )
}