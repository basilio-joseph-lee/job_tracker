'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex w-[45%] bg-[#6366F1] flex-col justify-between p-12 relative overflow-hidden">

        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute bottom-32 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-800/30 rounded-full" />

        <span className="font-jakarta font-extrabold text-2xl text-white relative z-10">Hirely</span>

        <div className="relative z-10">
          <h2 className="font-jakarta font-extrabold text-4xl text-white leading-tight mb-4">
            Your job search,<br />finally<br />organized.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Set daily goals, track every status, and watch your progress grow week by week.
          </p>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 border border-white/10">
            <p className="font-jakarta font-extrabold text-2xl text-white">Free</p>
            <p className="text-white/50 text-xs mt-0.5">No credit card needed</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 border border-white/10">
            <p className="font-jakarta font-extrabold text-2xl text-white">2 min</p>
            <p className="text-white/50 text-xs mt-0.5">To get started</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-[#F8FAFC] flex flex-col justify-center px-8 md:px-16 py-12">

        <span className="md:hidden font-jakarta font-extrabold text-2xl text-[#6366F1] mb-10 block">Hirely</span>

        <div className="w-full max-w-sm mx-auto">
          <span className="inline-block bg-indigo-50 text-[#6366F1] text-xs font-semibold px-3 py-1.5 rounded-lg mb-5">
            Get started
          </span>
          <h1 className="font-jakarta font-extrabold text-3xl text-[#0F172A] mb-1">Create account</h1>
          <p className="text-slate-400 text-sm mb-8">Free forever — no credit card needed</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">
                Confirm password
              </label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="mt-7 w-full bg-[#6366F1] hover:bg-indigo-500 disabled:opacity-50 text-white font-jakarta font-bold text-sm py-3.5 rounded-xl transition-colors shadow-md shadow-indigo-200"
          >
            {loading ? 'Creating account...' : 'Create account →'}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#6366F1] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}