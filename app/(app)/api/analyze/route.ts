import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = 'llama-3.1-8b-instant'

// ── groq LLM call ──────────────────────────────────────────────────────────

async function callLLM(resumeText: string, jdText: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 1600,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional hiring analyst, ATS simulator, and resume coach. Always respond with valid JSON only. No markdown, no explanation, no extra text.',
        },
        {
          role: 'user',
          content: `Analyze this resume against the job description.
Work for ANY industry (tech, finance, medical, marketing, etc).

RESUME:
${resumeText.slice(0, 1200)}

JOB DESCRIPTION:
${jdText.slice(0, 1200)}

Return ONLY this JSON (no markdown, no code fences):
{
  "match_score": <integer 0-100, overall fit between resume and JD>,
  "verdict": "<Strong Match | Moderate Match | Weak Match>",
  "shortlist_probability": <integer 0-100, estimated chance of getting an interview>,
  "ats_score": <integer 0-100, how well an ATS would parse/rank this resume for this JD>,
  "ats_risk_level": "<Low | Medium | High>",
  "matched_skills": [<list of skill strings found in both resume and JD>],
  "critical_missing_keywords": [<list of important keywords/skills in the JD but NOT found in the resume, ordered by importance, max 6>],
  "capability_gaps": [
    {
      "requirement": "<short requirement from the JD, e.g. '3 years PHP' or 'Docker'>",
      "candidate": "<what the resume actually shows for this, e.g. '1 year PHP' or 'Not mentioned'>",
      "gap": "<short description of the gap, e.g. '2 years' or 'Missing skill', or 'Match' if no gap>"
    }
  ],
  "recruiter_scan": {
    "impressed": [<1-3 short strings: what immediately impresses a recruiter doing a 10-second scan>],
    "concerns": [<1-3 short strings: what immediately concerns a recruiter doing a 10-second scan>],
    "shortlist_decision": "<Yes | Maybe | No>"
  },
  "resume_improvements": [
    {
      "section": "<section name, e.g. Experience, Skills, Summary, Objective, Projects>",
      "why": "<1 sentence: why this section matters for this JD>",
      "current": "<short excerpt or paraphrase of what is currently in the resume for this section — max 2 sentences>",
      "improved": "<concise rewritten version of that section tailored to the JD — max 3 sentences>"
    }
  ]
}

Provide 3-6 capability_gaps covering the most important JD requirements (include matches too, marked with gap "Match").
Provide 2-3 resume_improvements that would have the highest impact. Focus on sections where the candidate already has relevant experience but hasn't framed it for this specific role.`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${err}`)
  }

  const data = await res.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''

  console.log('[Groq raw response]:', raw.slice(0, 400))

  // extract JSON block
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Groq did not return valid JSON')

  return JSON.parse(jsonMatch[0])
}

// ── pdf extraction ─────────────────────────────────────────────────────────

async function extractPdfText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return new Promise<string>((resolve, reject) => {
    const parser = new PDFParser()
    parser.on('pdfParser_dataReady', (data: any) => {
      const text = data.Pages.flatMap((p: any) =>
        p.Texts.map((t: any) => decodeURIComponent(t.R[0].T))
      ).join(' ')
      resolve(text)
    })
    parser.on('pdfParser_dataError', reject)
    parser.parseBuffer(buffer)
  })
}

// ── main handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const resumeFile = formData.get('resume') as File
    const jdText = formData.get('jd') as string

    if (!resumeFile || !jdText) {
      return NextResponse.json(
        { error: 'Missing resume file or job description' },
        { status: 400 }
      )
    }

    const resumeText = await extractPdfText(resumeFile)

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Make sure it is not scanned.' },
        { status: 400 }
      )
    }

    console.log('[Resume text length]:', resumeText.length)

    const llmResult = await callLLM(resumeText, jdText)

    return NextResponse.json({
      matchScore: llmResult.match_score ?? 50,
      verdict: llmResult.verdict ?? 'Moderate Match',
      shortlistProbability: llmResult.shortlist_probability ?? 50,
      atsScore: llmResult.ats_score ?? 50,
      atsRiskLevel: llmResult.ats_risk_level ?? 'Medium',
      matchedSkills: llmResult.matched_skills ?? [],
      criticalMissingKeywords: llmResult.critical_missing_keywords ?? [],
      capabilityGaps: llmResult.capability_gaps ?? [],
      recruiterScan: {
        impressed: llmResult.recruiter_scan?.impressed ?? [],
        concerns: llmResult.recruiter_scan?.concerns ?? [],
        shortlistDecision: llmResult.recruiter_scan?.shortlist_decision ?? 'Maybe',
      },
      resumeImprovements: llmResult.resume_improvements ?? [],
    })
  } catch (err) {
    console.error('[analyze] error:', err)
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}