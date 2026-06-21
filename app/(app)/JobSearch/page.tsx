'use client'

import { useState, useRef, useEffect } from 'react'

// ── types ──────────────────────────────────────────────────────────────────

interface Job {
  index: number
  title: string
  company: string
  location: string
  salary: string
  highlights: string
  fit_note: string
  url: string
  posted: string
}

interface SearchResult {
  intent: {
    role: string
    location: string
    friendly_summary: string
  }
  summary: string
  jobs: Job[]
  totalFound: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  result?: SearchResult
  loading?: boolean
}

// ── suggested prompts ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Browse me developer jobs in Pampanga',
  'Find IT support roles around Manila',
  'Show remote software engineer positions',
  'Any entry level jobs in Angeles City',
  'Marketing jobs in Makati',
]

// ── job card ───────────────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  return (
    <div className="job-card">
      <div className="job-card-header">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="apply-btn"
        >
          Apply →
        </a>
      </div>

      <div className="job-meta">
        <span className="meta-tag">📍 {job.location}</span>
        <span className="meta-tag">💰 {job.salary}</span>
        <span className="meta-tag">🕐 {job.posted}</span>
      </div>

      <p className="job-highlights">{job.highlights}</p>
      <p className="job-fit">💡 {job.fit_note}</p>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function JobSearchPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your AI job search assistant. Tell me what role you're looking for and where — I'll find real, live job postings for you.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSearch(query: string) {
    if (!query.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
    }

    const loadingMsg: Message = {
      id: Date.now().toString() + '-loading',
      role: 'assistant',
      text: 'Searching for jobs...',
      loading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages(prev =>
          prev
            .filter(m => !m.loading)
            .concat({
              id: Date.now().toString(),
              role: 'assistant',
              text: `Sorry, something went wrong: ${data.error}`,
            })
        )
        return
      }

      const resultMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        text:
          data.jobs.length === 0
            ? data.summary
            : `Found ${data.totalFound} job${data.totalFound !== 1 ? 's' : ''} — here are the top results:`,
        result: data,
      }

      setMessages(prev => prev.filter(m => !m.loading).concat(resultMsg))
    } catch {
      setMessages(prev =>
        prev
          .filter(m => !m.loading)
          .concat({
            id: Date.now().toString(),
            role: 'assistant',
            text: 'Something went wrong. Please try again.',
          })
      )
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch(input)
    }
  }

  return (
    <>
      <style>{`
        /* escape the layout's p-8 padding and white bg */
        .js-shell {
          position: fixed;
          top: 0;
          right: 0;
          /* sidebar is ~224px wide */
          left: 224px;
          bottom: 0;
          background: #0a0a0f;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', system-ui, sans-serif;
          color: #e8e8f0;
          z-index: 10;
        }

        /* header */
        .js-header {
          padding: 16px 24px;
          border-bottom: 1px solid #1e1e2e;
          background: #0d0d16;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .js-header-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .js-header-title { font-size: 15px; font-weight: 600; color: #f0f0ff; }
        .js-header-sub   { font-size: 11px; color: #6b6b8a; }

        .js-live-badge {
          margin-left: auto;
          padding: 4px 10px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          border-radius: 20px;
          font-size: 11px;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .js-live-dot {
          width: 6px; height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: jsPulse 2s infinite;
        }

        @keyframes jsPulse {
          0%,100% { opacity:1; } 50% { opacity:0.4; }
        }

        /* chat scroll area */
        .js-chat {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .js-inner {
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* message rows */
        .js-row       { display:flex; gap:10px; align-items:flex-start; }
        .js-row.user  { flex-direction:row-reverse; }

        .js-avatar {
          width:30px; height:30px;
          border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-size:14px; flex-shrink:0;
        }
        .js-avatar.ai   { background: linear-gradient(135deg,#6366f1,#8b5cf6); }
        .js-avatar.user { background:#1e1e2e; border:1px solid #2e2e4e; }

        .js-bubble {
          max-width: 76%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.6;
        }
        .js-bubble.ai {
          background:#13131f;
          border:1px solid #1e1e2e;
          color:#d0d0e8;
          border-top-left-radius:4px;
        }
        .js-bubble.user {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff;
          border-top-right-radius:4px;
        }

        /* loading dots */
        .js-dots { display:flex; gap:4px; padding:4px 0; }
        .js-dots span {
          width:6px; height:6px;
          background:#6366f1; border-radius:50%;
          animation: jsBounce 1.2s infinite;
        }
        .js-dots span:nth-child(2) { animation-delay:.2s; }
        .js-dots span:nth-child(3) { animation-delay:.4s; }
        @keyframes jsBounce {
          0%,80%,100% { transform:translateY(0); opacity:.4; }
          40%          { transform:translateY(-6px); opacity:1; }
        }

        /* suggestions */
        .js-suggestions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
        .js-chip {
          padding:6px 14px;
          background:#13131f; border:1px solid #2a2a3e;
          border-radius:20px; font-size:12px; color:#9090b0;
          cursor:pointer; transition:all .2s;
        }
        .js-chip:hover { border-color:#6366f1; color:#c0c0e8; background:#1a1a2e; }

        /* results */
        .js-results { margin-top:12px; display:flex; flex-direction:column; gap:10px; }
        .js-result-summary {
          font-size:13px; color:#8b8baa;
          padding:10px 14px;
          background:#0f0f1a;
          border-left:3px solid #6366f1;
          border-radius:6px;
        }

        /* job card */
        .job-card {
          background:#0f0f1a; border:1px solid #1e1e2e;
          border-radius:12px; padding:16px;
          transition:border-color .2s;
        }
        .job-card:hover { border-color:#6366f1; }

        .job-card-header {
          display:flex; justify-content:space-between;
          align-items:flex-start; gap:12px; margin-bottom:10px;
        }
        .job-title   { font-size:15px; font-weight:600; color:#f0f0ff; margin-bottom:2px; }
        .job-company { font-size:13px; color:#6366f1; }

        .apply-btn {
          flex-shrink:0; padding:6px 14px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff; border-radius:8px; font-size:13px;
          font-weight:500; text-decoration:none; transition:opacity .2s;
        }
        .apply-btn:hover { opacity:.85; }

        .job-meta { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
        .meta-tag {
          font-size:12px; color:#6b6b8a;
          background:#1a1a28; padding:3px 10px;
          border-radius:20px; border:1px solid #2a2a3e;
        }
        .job-highlights { font-size:13px; color:#a0a0c0; line-height:1.6; margin-bottom:8px; }
        .job-fit        { font-size:12px; color:#8b5cf6; font-style:italic; }

        /* input bar */
        .js-input-area {
          padding:14px 16px;
          border-top:1px solid #1e1e2e;
          background:#0d0d16;
          flex-shrink:0;
        }
        .js-input-wrap {
          max-width:820px; margin:0 auto;
          display:flex; gap:10px; align-items:flex-end;
        }
        .js-textarea {
          flex:1;
          background:#13131f; border:1px solid #2a2a3e;
          border-radius:12px; padding:12px 16px;
          color:#e8e8f0; font-size:14px;
          resize:none; outline:none;
          font-family:inherit; line-height:1.5;
          transition:border-color .2s;
        }
        .js-textarea:focus   { border-color:#6366f1; }
        .js-textarea::placeholder { color:#3a3a5a; }

        .js-send {
          width:44px; height:44px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border:none; border-radius:12px;
          cursor:pointer; display:flex;
          align-items:center; justify-content:center;
          font-size:18px; color:#fff;
          transition:opacity .2s; flex-shrink:0;
        }
        .js-send:hover:not(:disabled) { opacity:.85; }
        .js-send:disabled { opacity:.4; cursor:not-allowed; }
      `}</style>

      <div className="js-shell">
        {/* header */}
        <div className="js-header">
          <div className="js-header-icon">🔍</div>
          <div>
            <div className="js-header-title">Job Search</div>
            <div className="js-header-sub">AI-powered · Adzuna + Groq</div>
          </div>
          <div className="js-live-badge">
            <div className="js-live-dot" />
            Live jobs
          </div>
        </div>

        {/* chat */}
        <div className="js-chat">
          <div className="js-inner">
            {messages.map(msg => (
              <div key={msg.id} className={`js-row ${msg.role}`}>
                <div className={`js-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className={`js-bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                  {msg.loading ? (
                    <div className="js-dots"><span /><span /><span /></div>
                  ) : (
                    <>
                      <div>{msg.text}</div>

                      {msg.id === 'welcome' && (
                        <div className="js-suggestions">
                          {SUGGESTIONS.map(s => (
                            <button key={s} className="js-chip" onClick={() => handleSearch(s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.result && msg.result.jobs.length > 0 && (
                        <div className="js-results">
                          <div className="js-result-summary">{msg.result.summary}</div>
                          {msg.result.jobs.map(job => (
                            <JobCard key={job.index} job={job} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* input */}
        <div className="js-input-area">
          <div className="js-input-wrap">
            <textarea
              className="js-textarea"
              rows={1}
              placeholder="e.g. Browse me IT support jobs in Pampanga..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="js-send"
              onClick={() => handleSearch(input)}
              disabled={!input.trim() || loading}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </>
  )
}