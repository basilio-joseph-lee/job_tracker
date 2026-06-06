'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — full height indigo ── */}
      <div className="hidden md:flex w-[45%] bg-[#6366F1] flex-col justify-between p-12 relative overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute bottom-32 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-800/30 rounded-full" />

        <span className="font-jakarta font-extrabold text-2xl text-white relative z-10">Hirely</span>

        <div className="relative z-10">
          <h2 className="font-jakarta font-extrabold text-4xl text-white leading-tight mb-4">
            Track every<br />application.<br />Land faster.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Stay on top of your job search with daily goals, analytics, and full status tracking.
          </p>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 border border-white/10">
            <p className="font-jakarta font-extrabold text-2xl text-white">2,400+</p>
            <p className="text-white/50 text-xs mt-0.5">Active job seekers</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 border border-white/10">
            <p className="font-jakarta font-extrabold text-2xl text-white">48,000+</p>
            <p className="text-white/50 text-xs mt-0.5">Applications tracked</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — full height slate ── */}
      <div className="flex-1 bg-[#F8FAFC] flex flex-col justify-center px-8 md:px-16 py-12">

        {/* Mobile logo */}
        <span className="md:hidden font-jakarta font-extrabold text-2xl text-[#6366F1] mb-10 block">Hirely</span>

        <div className="w-full max-w-sm mx-auto">
          <span className="inline-block bg-indigo-50 text-[#6366F1] text-xs font-semibold px-3 py-1.5 rounded-lg mb-5">
            Welcome back
          </span>
          <h1 className="font-jakarta font-extrabold text-3xl text-[#0F172A] mb-1">Sign in</h1>
          <p className="text-slate-400 text-sm mb-8">Enter your credentials to continue</p>

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
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Password</label>
                <a href="#" className="text-xs text-[#6366F1] font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-7 w-full bg-[#6366F1] hover:bg-indigo-500 disabled:opacity-50 text-white font-jakarta font-bold text-sm py-3.5 rounded-xl transition-colors shadow-md shadow-indigo-200"
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            No account yet?{' '}
            <Link href="/register" className="text-[#6366F1] font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}