'use client'
import { useState, useEffect, useRef } from 'react'

// ── types ──────────────────────────────────────────────────────────────────

interface CapabilityGap {
  requirement: string
  candidate: string
  gap: string
}

interface ResumeImprovement {
  section: string
  why: string
  current: string
  improved: string
}

interface RecruiterScan {
  impressed: string[]
  concerns: string[]
  shortlistDecision: string
}

interface AnalysisResult {
  matchScore: number
  verdict: string
  shortlistProbability: number
  atsScore: number
  atsRiskLevel: string
  matchedSkills: string[]
  criticalMissingKeywords: string[]
  capabilityGaps: CapabilityGap[]
  recruiterScan: RecruiterScan
  resumeImprovements: ResumeImprovement[]
}

// ── stagger hook ───────────────────────────────────────────────────────────

function useStagger(count: number, active: boolean, delayMs = 80) {
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false))

  useEffect(() => {
    if (!active) {
      setVisible(Array(count).fill(false))
      return
    }
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          if (!cancelled)
            setVisible(v => v.map((b, idx) => (idx === i ? true : b)))
        }, i * delayMs)
      )
    }
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [count, active, delayMs])

  return visible
}

// ── score ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 200)
    return () => clearTimeout(t)
  }, [score])

  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (animated / 100) * circ
  const color = score >= 75 ? '#6366F1' : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative shrink-0">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-jakarta font-extrabold text-xl text-[#0F172A] leading-none">
          {score}%
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">{label}</span>
      </div>
    </div>
  )
}

// ── verdict / risk badges ──────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, string> = {
    'Strong Match': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Moderate Match': 'bg-amber-50 text-amber-600 border-amber-200',
    'Weak Match': 'bg-red-50 text-red-500 border-red-200',
  }
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border ${map[verdict] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}
    >
      {verdict}
    </span>
  )
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200',
    High: 'bg-red-50 text-red-500 border-red-200',
  }
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border ${map[level] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}
    >
      {level} risk
    </span>
  )
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    Yes: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Maybe: 'bg-amber-50 text-amber-600 border-amber-200',
    No: 'bg-red-50 text-red-500 border-red-200',
  }
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border ${map[decision] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}
    >
      {decision}
    </span>
  )
}

function GapStatus({ gap }: { gap: string }) {
  const isMatch = gap.trim().toLowerCase() === 'match'
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        isMatch
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-red-50 text-red-500'
      }`}
    >
      {isMatch ? 'Match' : 'Gap'}
    </span>
  )
}

// ── improvement card ──────────────────────────────────────────────────────

function ImprovementCard({ item, index }: { item: ResumeImprovement; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(item.improved)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
      {/* header row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-jakarta font-bold text-sm text-[#0F172A]">
          {item.section}
        </span>
        <span className={`text-slate-400 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* collapsible body */}
      {open && (
        <div className="border-t border-slate-100">
          {/* why banner */}
          <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">Why this matters: </span>
              {item.why}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* current */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Current section
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">{item.current}</p>
            </div>

            {/* improved */}
            <div className="px-5 py-4 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-wider">
                  ✦ Improved
                </p>
                <button
                  onClick={copy}
                  className="text-[10px] font-semibold text-slate-400 hover:text-[#6366F1] transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-[#0F172A] leading-relaxed font-medium">{item.improved}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── skill gap checklist ─────────────────────────────────────────────────────

function SkillGapItem({ skill }: { skill: string }) {
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null)

  return (
    <div className="py-3.5 first:pt-0 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-bold text-[#0F172A]">{skill}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setAnswer('yes')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              answer === 'yes'
                ? 'bg-[#6366F1] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-[#6366F1]'
            }`}
          >
            I've used this
          </button>
          <button
            onClick={() => setAnswer('no')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              answer === 'no'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Not yet
          </button>
        </div>
      </div>

      {answer === 'yes' && (
        <div className="mt-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <p className="text-sm text-indigo-700 leading-relaxed">
            Add a bullet to your Experience or Skills section, e.g.{' '}
            <span className="font-semibold text-[#0F172A]">
              "Used {skill} to [accomplish a specific task or result]."
            </span>{' '}
            Be specific about where and how you used it.
          </p>
        </div>
      )}

      {answer === 'no' && (
        <div className="mt-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            This is a gap worth closing. Look for a related project, course, or transferable
            experience you can mention, or consider picking up a quick tutorial in{' '}
            <span className="font-semibold text-[#0F172A]">{skill}</span> before applying.
          </p>
        </div>
      )}
    </div>
  )
}



function SectionLabel({ icon, label, subtitle, color }: { icon: string; label: string; subtitle: string; color: string }) {
  return (
    <div className="flex items-start gap-3 mt-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: `${color}1A` }}
      >
        {icon}
      </div>
      <div>
        <h2 className="font-jakarta font-extrabold text-xl text-[#0F172A] leading-tight">
          {label}
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

// ── views ──────────────────────────────────────────────────────────────────

type View = 'input' | 'results'

const INPUT_BLOCKS = 3
const RESULT_BLOCKS = 7

// ── main page ──────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [view, setView] = useState<View>('input')

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputVisible = useStagger(INPUT_BLOCKS, view === 'input', 90)
  const resultVisible = useStagger(RESULT_BLOCKS, view === 'results', 90)

  const si = (i: number) => ({
    opacity: inputVisible[i] ? 1 : 0,
    transform: inputVisible[i] ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  const sr = (i: number) => ({
    opacity: resultVisible[i] ? 1 : 0,
    transform: resultVisible[i] ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  })

  async function handleAnalyze() {
    if (!resumeFile || !jdText.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jd', jdText)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      setResult(data)
      setView('results')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAnalyzeAnother() {
    setJdText('')
    setResult(null)
    setError(null)
    setView('input')
  }

  const canAnalyze = !!resumeFile && jdText.trim().length > 20 && !loading

  // ── INPUT VIEW ─────────────────────────────────────────────────────────

  if (view === 'input') {
    return (
      <div className="max-w-3xl mx-auto px-2 flex flex-col min-h-[calc(100vh-120px)]">

        {/* BLOCK 0: Header */}
        <div style={si(0)} className="mb-6">
          <h1 className="font-jakarta font-extrabold text-2xl text-[#0F172A] tracking-tight">
            Match your resume to a{' '}
            <span className="text-[#6366F1]">job description</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload your PDF resume and paste the job description to get a fit analysis, ATS score, and tailored rewrite suggestions.
          </p>
        </div>

        {/* BLOCK 1: Inputs */}
        <div style={si(1)} className="grid grid-cols-1 gap-4 md:grid-cols-2 flex-1 mb-4 md:items-stretch">

          {/* PDF upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl px-5 py-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center
              ${resumeFile
                ? 'border-[#6366F1] bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
              }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-2xl mb-2">{resumeFile ? '✅' : '📎'}</p>
            <p className="font-jakarta font-bold text-sm text-[#0F172A]">
              {resumeFile ? resumeFile.name : 'Upload Resume PDF'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {resumeFile ? 'Click to replace' : 'Click to browse'}
            </p>
          </div>

          {/* JD textarea */}
          <div className="flex flex-col h-full">
            <label className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Job Description
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-slate-300 resize-none focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-indigo-200 transition-all min-h-[200px]"
            />
          </div>
        </div>

        {/* BLOCK 2: Analyze button */}
        <div style={si(2)} className="mt-auto pt-4 pb-6">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className={`w-full py-3.5 rounded-2xl font-jakarta font-bold text-sm transition-all
              ${canAnalyze
                ? 'bg-[#6366F1] text-white hover:bg-indigo-500 hover:shadow-md active:scale-[0.98]'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              '✨ Analyze Fit'
            )}
          </button>

          {error && (
            <p className="text-xs text-red-500 text-center mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
              {error}
            </p>
          )}
        </div>

      </div>
    )
  }

  // ── RESULTS VIEW ───────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-2">
      {result && (
        <div className="flex flex-col gap-5 pb-20">

          {/* BLOCK 0: Results header */}
          <div style={sr(0)}>
            <h1 className="font-jakarta font-extrabold text-3xl text-[#0F172A] tracking-tight">
              Analysis <span className="text-[#6366F1]">complete</span>
            </h1>
            {resumeFile && (
              <p className="text-slate-400 text-sm mt-1">
                <span className="text-slate-500 font-medium">{resumeFile.name}</span>
              </p>
            )}
          </div>

          {/* ── OVERALL MATCH & ATS ──────────────────────────────────── */}
          <SectionLabel
            icon="🎯"
            label="Overall match"
            subtitle="How well your resume aligns with this job, and how an ATS would treat it."
            color="#6366F1"
          />

          {/* BLOCK 1: Match score + ATS score side by side */}
          <div style={sr(1)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Match score */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-[#6366F1] p-5 flex items-center gap-5">
              <ScoreRing score={result.matchScore} label="overall fit" />
              <div className="flex flex-col gap-2">
                <VerdictBadge verdict={result.verdict} />
                <p className="text-xs text-slate-400">
                  Estimated interview chance:{' '}
                  <span className="font-semibold text-[#0F172A]">{result.shortlistProbability}%</span>
                </p>
              </div>
            </div>

            {/* ATS score */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-amber-400 p-5 flex items-center gap-5">
              <ScoreRing score={result.atsScore} label="ATS score" />
              <div className="flex flex-col gap-2">
                <RiskBadge level={result.atsRiskLevel} />
                <p className="text-xs text-slate-400 leading-relaxed max-w-[160px]">
                  How well an ATS would parse and rank this resume for this role.
                </p>
              </div>
            </div>
          </div>

          {/* ── CRITICAL MISSING KEYWORDS ───────────────────────────────── */}
          <SectionLabel
            icon="🔑"
            label="Critical missing keywords"
            subtitle="Skills the job description emphasizes — and how your resume currently stacks up."
            color="#EF4444"
          />

          {/* BLOCK 2: Missing keywords + matched skills */}
          <div style={sr(2)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-red-400 p-5">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">
                ⚠ Missing from resume
              </p>
              {result.criticalMissingKeywords.length === 0 ? (
                <p className="text-sm text-slate-300">None detected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.criticalMissingKeywords.map(kw => (
                    <span
                      key={kw}
                      className="text-xs bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-full font-semibold"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                These appear in the job description but weren't found in your resume.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-emerald-400 p-5">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">
                ✓ Matched skills
              </p>
              {result.matchedSkills.length === 0 ? (
                <p className="text-sm text-slate-300">None detected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map(skill => (
                    <span
                      key={skill}
                      className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── CAPABILITY GAP ANALYSIS ─────────────────────────────────── */}
          {result.capabilityGaps.length > 0 && (
            <>
              <SectionLabel
                icon="📊"
                label="Capability gap analysis"
                subtitle="A side-by-side look at what the role asks for vs. what your resume shows."
                color="#8B5CF6"
              />

              {/* BLOCK 3: Gap table */}
              <div style={sr(3)} className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-violet-400 overflow-hidden">
                <div className="grid grid-cols-3 bg-slate-50 px-5 py-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requirement</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {result.capabilityGaps.map((g, i) => (
                    <div key={i} className="grid grid-cols-3 px-5 py-3.5 items-center">
                      <span className="text-sm font-semibold text-[#0F172A] pr-2">{g.requirement}</span>
                      <span className="text-sm text-slate-500 pr-2">{g.candidate}</span>
                      <span className="flex justify-end">
                        <GapStatus gap={g.gap} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── RECRUITER'S 10-SECOND IMPRESSION ───────────────────────── */}
          <SectionLabel
            icon="👀"
            label="Recruiter's 10-second impression"
            subtitle="A quick gut-check, the way a recruiter would skim your resume."
            color="#0EA5E9"
          />

          {/* BLOCK 4: Recruiter scan */}
          <div style={sr(4)} className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-sky-400 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="font-jakarta font-bold text-sm text-[#0F172A]">Would I shortlist this candidate?</p>
              <DecisionBadge decision={result.recruiterScan.shortlistDecision} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  What stands out
                </p>
                {result.recruiterScan.impressed.length === 0 ? (
                  <p className="text-sm text-slate-300">Nothing notable</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {result.recruiterScan.impressed.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                  Concerns
                </p>
                {result.recruiterScan.concerns.length === 0 ? (
                  <p className="text-sm text-slate-300">None noted</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {result.recruiterScan.concerns.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ── RESUME REWRITE SUGGESTIONS ─────────────────────────────── */}
          {(result.criticalMissingKeywords.length > 0 ||
            result.capabilityGaps.some(g => g.gap.trim().toLowerCase() !== 'match') ||
            result.resumeImprovements.length > 0) && (
            <>
              <SectionLabel
                icon="✍️"
                label="Resume rewrite suggestions"
                subtitle="A few targeted edits that could meaningfully improve your fit for this role."
                color="#6366F1"
              />

              {/* Skill check */}
              {(() => {
                const gapSkills = result.capabilityGaps
                  .filter(g => g.gap.trim().toLowerCase() !== 'match')
                  .map(g => g.requirement)
                const skills = Array.from(
                  new Set([...result.criticalMissingKeywords, ...gapSkills])
                )

                if (skills.length === 0) return null

                return (
                  <div style={sr(5)} className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-indigo-300 px-5 py-5">
                    <p className="text-sm font-semibold text-[#0F172A] mb-1">
                      Quick check before adding these
                    </p>
                    <p className="text-sm text-slate-400 mb-2">
                      The JD asks for these skills — let us know if you've used them before.
                    </p>
                    <div className="flex flex-col">
                      {skills.map(skill => (
                        <SkillGapItem key={skill} skill={skill} />
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Sections to update */}
              {result.resumeImprovements.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Sections of your resume worth updating
                  </p>
                  {result.resumeImprovements.map((item, i) => (
                    <ImprovementCard key={i} item={item} index={i} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CTA ───────────────────────────────────────────────────── */}
          <div style={sr(6)} className="mt-1">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-jakarta font-bold text-sm text-[#0F172A]">
                  Try another job description?
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your resume{resumeFile ? ` (${resumeFile.name})` : ''} stays loaded — just paste a new JD.
                </p>
              </div>
              <button
                onClick={handleAnalyzeAnother}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-[#6366F1] text-white font-jakarta font-bold text-sm hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] transition-all"
              >
                ← Analyze Another Job
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}