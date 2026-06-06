'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Target, ChartColumn,
  Briefcase, NotebookPen, ShieldCheck,
} from "lucide-react"

// ── Reusable fade-up hook using IntersectionObserver ──
function useFadeUp(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, visible } = useFadeUp()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] font-inter overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#6366F1] shadow-lg' : 'bg-[#6366F1]'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">Hirely</span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/80 hover:text-white text-sm transition-colors">Features</a>
            <a href="#how-it-works" className="text-white/80 hover:text-white text-sm transition-colors">Workflow</a>
            <Link href="/login" className="text-white/80 hover:text-white text-sm transition-colors">Login</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/register" className="bg-[#0F172A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-jakarta">
              Get started free
            </Link>
          </div>
          <button className="md:hidden text-white p-1" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#5254cc] px-6 pb-4 flex flex-col gap-3">
            <a href="#features" className="text-white/80 text-sm py-1" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-white/80 text-sm py-1" onClick={() => setMenuOpen(false)}>How it works</a>
            <Link href="/login" className="text-white/80 text-sm py-1" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link href="/register" className="bg-[#0F172A] text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center mt-1 font-jakarta" onClick={() => setMenuOpen(false)}>
              Get started free
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO — animates on mount ── */}
      <section className="bg-[#6366F1] pt-32 pb-20 px-6 text-center text-white">
        <div
          style={{ opacity: 1, animation: 'fadeUp 0.6s ease both' }}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div className="inline-block bg-white/15 text-white text-xs font-medium px-4 py-1.5 rounded-full mb-6" style={{ animationDelay: '0ms' }}>
            Now in public beta — free to use
          </div>
          <h1 className="font-jakarta font-extrabold text-4xl md:text-6xl leading-tight tracking-tight mb-5 max-w-3xl mx-auto" style={{ animation: 'fadeUp 0.6s ease 100ms both' }}>
            Track your job hunt.<br />
            <span className="text-indigo-200">Land your next role.</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-md mx-auto mb-9 leading-relaxed" style={{ animation: 'fadeUp 0.6s ease 200ms both' }}>
            Hirely keeps every application organized, your daily goals on track, and your progress visible — all in one clean dashboard.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap" style={{ animation: 'fadeUp 0.6s ease 300ms both' }}>
            <Link href="/register" className="bg-[#0F172A] text-white font-jakarta font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-colors">
              Get started free
            </Link>
            <a href="#how-it-works" className="bg-white/15 border border-white/30 text-white font-jakarta font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
              See how it works
            </a>
          </div>
        </div>

        {/* Mock Dashboard */}
        <div className="mt-14 max-w-2xl mx-auto bg-white/10 border border-white/20 rounded-2xl overflow-hidden" style={{ animation: 'fadeUp 0.7s ease 400ms both' }}>
          <div className="bg-white/15 px-4 py-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex">
            <div className="w-36 bg-black/15 p-4 hidden sm:flex flex-col gap-1 flex-shrink-0">
              <p className="font-jakarta font-bold text-white text-sm mb-3">Hirely</p>
              <div className="bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg">Dashboard</div>
              <div className="text-white/60 text-xs px-3 py-1.5">Applications</div>
              <div className="text-white/60 text-xs px-3 py-1.5">Analytics</div>
            </div>
            <div className="flex-1 p-4">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ n: '24', l: 'Total applied' }, { n: '6', l: 'Interviews' }, { n: '2', l: 'Offers' }].map(s => (
                  <div key={s.l} className="bg-white/15 rounded-xl p-3 text-center">
                    <p className="font-jakarta font-bold text-white text-xl">{s.n}</p>
                    <p className="text-white/60 text-[10px] mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2.5 mb-2">
                <div className="flex justify-between text-[10px] text-white/80 mb-1.5">
                  <span>Today's goal</span><span>3 / 5 apps</span>
                </div>
                <div className="bg-white/20 rounded-full h-1.5">
                  <div className="bg-emerald-400 rounded-full h-1.5 w-[60%]" />
                </div>
              </div>
              {[
                { title: 'Senior Frontend Dev', co: 'Stripe · 2025-06-04', badge: 'interview', badgeClass: 'bg-yellow-400/30 text-yellow-200' },
                { title: 'Product Designer',    co: 'Notion · 2025-06-03', badge: 'offer',     badgeClass: 'bg-emerald-400/30 text-emerald-200' },
                { title: 'UX Engineer',         co: 'Linear · 2025-06-02', badge: 'applied',   badgeClass: 'bg-white/20 text-white/80' },
              ].map(r => (
                <div key={r.title} className="bg-white/10 rounded-xl px-3 py-2 mb-1.5 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-medium">{r.title}</p>
                    <p className="text-white/50 text-[10px]">{r.co}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${r.badgeClass}`}>{r.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <FadeUp>
        <div className="bg-[#0F172A] py-4 px-6 text-center">
          <p className="text-white/50 text-sm">
            Trusted by <span className="text-indigo-300 font-semibold">2,400+ job seekers</span> actively tracking their applications
          </p>
        </div>
      </FadeUp>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-[#6366F1] text-xs font-semibold tracking-widest uppercase mb-3">Features</p>
            <h2 className="font-jakarta font-extrabold text-3xl md:text-4xl text-[#0F172A] mb-3 tracking-tight">
              Everything you need to stay organized
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              No more spreadsheets. No more forgotten follow-ups. Just a clean, focused tracker.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: LayoutDashboard, title: 'Unified dashboard',     desc: 'See all your applications, stats, and daily progress at a glance the moment you log in.' },
              { icon: Target,          title: 'Daily goals',           desc: 'Set a daily application target and watch the progress bar fill up. Stay consistent, stay motivated.' },
              { icon: ChartColumn,     title: 'Analytics & insights',  desc: 'Track your response rate, interviews won, and applications by status — monthly or all time.' },
              { icon: Briefcase,       title: 'Application tracking',  desc: 'Organize every application and always know where you stand in the hiring process.' },
              { icon: NotebookPen,     title: 'Notes & details',       desc: 'Add job descriptions, URLs, and personal notes to every application. Never lose context again.' },
              { icon: ShieldCheck,     title: 'Secure & private',      desc: 'Your data is yours. Auth-protected accounts ensure only you can see your applications.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <FadeUp key={f.title} delay={i * 80}>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all h-full">
                    <div className="w-11 h-11 border border-slate-200 rounded-xl flex items-center justify-center mb-4">
                      <Icon size={20} className="text-slate-900" />
                    </div>
                    <h3 className="font-jakarta font-bold text-[#0F172A] text-sm mb-2">{f.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </FadeUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-[#6366F1] text-xs font-semibold tracking-widest uppercase mb-3">How it works</p>
            <h2 className="font-jakarta font-extrabold text-3xl md:text-4xl text-[#0F172A] mb-3 tracking-tight">
              Up and running in minutes
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
              Three simple steps to take control of your job search.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '1', title: 'Create your account',    desc: 'Sign up for free in seconds. No credit card, no setup — just your email and a password.' },
              { n: '2', title: 'Add your applications',  desc: 'Log each job you apply to with the company, role, date, status, and any notes you want.' },
              { n: '3', title: 'Track & hit your goals', desc: 'Update statuses as you progress, monitor your analytics, and hit your daily targets.' },
            ].map((s, i) => (
              <FadeUp key={s.n} delay={i * 120}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#6366F1] text-white font-jakarta font-extrabold text-lg rounded-full flex items-center justify-center mx-auto mb-4">
                    {s.n}
                  </div>
                  <h3 className="font-jakarta font-bold text-[#0F172A] text-base mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATUS SHOWCASE ── */}
      <section className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <p className="text-[#6366F1] text-xs font-semibold tracking-widest uppercase mb-3">Status Tracking</p>
            <h2 className="font-jakarta font-extrabold text-3xl md:text-4xl text-[#0F172A] mb-3">
              Follow every application from start to finish
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto mb-14">
              Never lose track of where you stand in the hiring process.
            </p>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="hidden md:flex items-center justify-center">
              <div className="flex items-center">
                {['Applied', 'Screening', 'Interview', 'Technical', 'Offer'].map((status, index, arr) => (
                  <div key={status} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#6366F1] text-white font-bold flex items-center justify-center shadow-md">
                        {index + 1}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-700">{status}</p>
                    </div>
                    {index !== arr.length - 1 && <div className="w-24 h-[2px] bg-indigo-200 mx-4" />}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── ANALYTICS PREVIEW ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-[#6366F1] text-xs font-semibold tracking-widest uppercase mb-3">Analytics</p>
            <h2 className="font-jakarta font-extrabold text-3xl md:text-4xl text-[#0F172A] mb-3 tracking-tight">
              Know your numbers
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Understand what's working and where to focus your energy this month.
            </p>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-7">
              <p className="font-jakarta font-bold text-[#0F172A] text-sm mb-5">June 2025</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { n: '24',  l: 'Applied this month', c: '#0F172A' },
                  { n: '6',   l: 'Interviews',         c: '#0F172A' },
                  { n: '25%', l: 'Response rate',      c: '#10B981' },
                ].map(s => (
                  <div key={s.l} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <p className="font-jakarta font-extrabold text-2xl md:text-3xl" style={{ color: s.c }}>{s.n}</p>
                    <p className="text-slate-400 text-xs mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-400 mb-3">By status</p>
              {[
                { label: 'Applied',   count: 12, pct: 50, color: '#6366F1' },
                { label: 'Screening', count: 4,  pct: 17, color: '#6366F1' },
                { label: 'Interview', count: 3,  pct: 13, color: '#F59E0B' },
                { label: 'Offer',     count: 2,  pct: 8,  color: '#10B981' },
                { label: 'Rejected',  count: 3,  pct: 13, color: '#EF4444' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs text-slate-500 w-20">{b.label}</span>
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                  <span className="text-xs text-slate-500 w-5 text-right">{b.count}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <FadeUp>
        <section className="bg-[#6366F1] py-20 px-6 text-center">
          <h2 className="font-jakarta font-extrabold text-3xl md:text-5xl text-white mb-4 tracking-tight">
            Ready to land your next role?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8">
            Join thousands of job seekers already tracking smarter with Hirely.
          </p>
          <Link href="/register" className="inline-block bg-[#0F172A] text-white font-jakarta font-semibold text-base px-9 py-4 rounded-xl hover:bg-slate-800 transition-colors">
            Get started free
          </Link>
        </section>
      </FadeUp>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F172A] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-jakarta font-extrabold text-xl text-white">Hirely</span>
          <div className="flex gap-6 flex-wrap justify-center">
            {['Features', 'Login', 'Register'].map(l => (
              <a key={l} href={l === 'Login' ? '/login' : l === 'Register' ? '/register' : `#${l.toLowerCase()}`}
                className="text-white/40 hover:text-white/70 text-sm transition-colors">
                {l}
              </a>
            ))}
          </div>
          <p className="text-white/30 text-xs">© 2025 Hirely. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}