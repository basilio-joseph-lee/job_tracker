import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = 'llama-3.1-8b-instant'
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY

// ── extract search intent from natural language ────────────────────────────

// ── supported adzuna countries ─────────────────────────────────────────────
// ph is NOT supported. We map user intent to the best available country.

const COUNTRY_MAP: Record<string, string> = {
  // Southeast Asia / Pacific → Singapore (closest SEA hub)
  philippines: 'sg', pampanga: 'sg', manila: 'sg', cebu: 'sg', davao: 'sg',
  singapore: 'sg', malaysia: 'sg', indonesia: 'sg', thailand: 'sg',
  // Oceania
  australia: 'au', sydney: 'au', melbourne: 'au',
  'new zealand': 'nz', auckland: 'nz',
  // Americas
  'united states': 'us', usa: 'us', 'new york': 'us', california: 'us',
  canada: 'ca', toronto: 'ca', vancouver: 'ca',
  brazil: 'br', mexico: 'mx',
  // Europe
  'united kingdom': 'gb', uk: 'gb', london: 'gb',
  germany: 'de', berlin: 'de', france: 'fr', paris: 'fr',
  spain: 'es', madrid: 'es', netherlands: 'nl', amsterdam: 'nl',
  italy: 'it', rome: 'it', poland: 'pl', warsaw: 'pl',
  belgium: 'be', brussels: 'be', switzerland: 'ch', austria: 'at',
  // Asia
  india: 'in', mumbai: 'in', bangalore: 'in',
  // Africa
  'south africa': 'za', johannesburg: 'za',
}

function resolveCountry(location: string, isRemote: boolean): string {
  if (isRemote) return 'us' // largest remote job pool
  const key = location.toLowerCase()
  for (const [term, code] of Object.entries(COUNTRY_MAP)) {
    if (key.includes(term)) return code
  }
  return 'sg' // default fallback for unrecognized (best for SEA users)
}

async function extractSearchIntent(userMessage: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content:
            'You extract job search parameters from natural language. Always respond with valid JSON only. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Extract job search intent from this message: "${userMessage}"

Return ONLY this JSON:
{
  "role": "<job title or role keywords, e.g. 'react developer' or 'IT support'>",
  "location": "<city, region, or country the user mentioned, e.g. 'Pampanga' or 'Manila' or 'Singapore'. Use 'philippines' if they mention PH locations with no specific city>",
  "is_remote": <true if user wants remote/work from home, false otherwise>,
  "employment_type": "<full_time | part_time | contract | any>",
  "friendly_summary": "<1 short sentence summarizing what the user is looking for>"
}`,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error('Groq intent extraction failed')
  const data = await res.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse intent')
  const intent = JSON.parse(jsonMatch[0])

  // resolve to a valid Adzuna country code
  intent.country = resolveCountry(intent.location ?? '', intent.is_remote ?? false)
  intent.country_label = intent.is_remote
    ? 'Remote (Global)'
    : intent.country === 'sg'
    ? `${intent.location} area (via Singapore)`
    : intent.location

  return intent
}

// ── search adzuna for jobs ─────────────────────────────────────────────────

async function searchAdzuna(role: string, location: string, country: string) {
  // only pass location to Adzuna if it's a real city in that country
  // for PH locations we already mapped to 'sg', so skip the where param
  const isPhLocation = ['pampanga','manila','cebu','davao','philippines','quezon','makati','pasig','taguig','laguna','cavite','bulacan'].some(
    ph => location.toLowerCase().includes(ph)
  )

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID!,
    app_key: ADZUNA_APP_KEY!,
    results_per_page: '10',
    what: role,
  })

  // only add 'where' if it's a real city in that country
  if (!isPhLocation) {
    params.set('where', location)
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`
  console.log('[Adzuna URL]:', url)
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Adzuna API error: ${err}`)
  }

  const data = await res.json()
  return data.results ?? []
}

// ── summarize job results with groq ───────────────────────────────────────

async function summarizeResults(jobs: any[], intent: any) {
  if (jobs.length === 0) return []

  // only send top 5 to groq to save tokens
  const topJobs = jobs.slice(0, 5).map((j: any, i: number) => ({
    index: i + 1,
    title: j.title,
    company: j.company?.display_name ?? 'Unknown',
    location: j.location?.display_name ?? 'Unknown',
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    description: j.description?.slice(0, 300) ?? '',
    url: j.redirect_url,
    created: j.created,
  }))

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            'You are a job search assistant. Always respond with valid JSON only. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Summarize these job listings for someone looking for: "${intent.friendly_summary}" (searched in: ${intent.country_label})

Jobs:
${JSON.stringify(topJobs, null, 2)}

Return ONLY this JSON:
{
  "summary": "<1-2 sentence overview of what was found>",
  "jobs": [
    {
      "index": <number>,
      "title": "<job title>",
      "company": "<company name>",
      "location": "<location>",
      "salary": "<formatted salary range or 'Not specified'>",
      "highlights": "<2-3 sentence summary of the role and key requirements>",
      "fit_note": "<1 short sentence on who this role is best for>",
      "url": "<apply url>",
      "posted": "<formatted date or 'Recently posted'>"
    }
  ]
}`,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error('Groq summarization failed')
  const data = await res.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse summary')
  return JSON.parse(jsonMatch[0])
}

// ── main handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message || message.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please describe what job you are looking for.' },
        { status: 400 }
      )
    }

    // step 1: extract intent
    const intent = await extractSearchIntent(message)
    console.log('[Intent]:', intent)

    // step 2: search adzuna
    const rawJobs = await searchAdzuna(intent.role, intent.location, intent.country)
    console.log('[Adzuna results]:', rawJobs.length)

    if (rawJobs.length === 0) {
      return NextResponse.json({
        intent,
        summary: `No jobs found for "${intent.role}" in the ${intent.country_label} market. Try broader keywords or a different role title.`,
        jobs: [],
        totalFound: 0,
      })
    }

    // step 3: summarize with groq
    const summarized = await summarizeResults(rawJobs, intent)

    return NextResponse.json({
      intent,
      summary: summarized.summary,
      jobs: summarized.jobs ?? [],
      totalFound: rawJobs.length,
    })
  } catch (err) {
    console.error('[job-search] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}