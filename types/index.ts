export type Status =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn'

export type JobApplication = {
  id: string
  user_id: string
  job_title: string
  company: string
  description: string | null
  job_url: string | null
  applied_at: string
  status: Status
  note: string | null
  created_at: string
}