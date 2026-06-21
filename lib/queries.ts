import { createClient } from './supabase'
import type { JobApplication, Status } from '@/types'

export async function getApplications(page = 1, pageSize = 10) {
  const supabase = createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact' })
    .order('applied_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data as JobApplication[], total: count ?? 0 }
}
export async function addApplication(input: Omit<JobApplication, 'id' | 'user_id' | 'created_at'>) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('user:', user)
  console.log('authError:', authError)
  if (!user) {
    console.log('No user found!')
    return
  }
  const { data, error } = await supabase
    .from('job_applications')
    .insert({ ...input, user_id: user.id })
  console.log('insert data:', data)
  console.log('insert error:', error)
  if (error) throw error
}
export async function updateApplication(id: string, input: Partial<JobApplication>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('job_applications')
    .update(input)
    .eq('id', id)
  if (error) throw error
}

export async function deleteApplication(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getMonthlyStats(year: number, month: number) {
  const supabase = createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .gte('applied_at', from)
    .lt('applied_at', to)
  if (error) throw error
  return data as JobApplication[]
}