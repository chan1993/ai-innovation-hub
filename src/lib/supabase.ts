import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type IdeaLinks = {
  github?: string
  demo?: string
  sharepoint?: string
  references?: string[]
}

export type Idea = {
  id: string
  s_no: number
  project: string
  idea: string
  outcome: string
  person_name: string
  person_email: string
  status: 'Idea' | 'In Progress' | 'Implemented' | 'Archived'
  views: number
  links: IdeaLinks
  poc_emails: string[]
  ai_platforms: string[]
  implementation_notes?: string
  created_at: string
  updated_at: string
  time_to_implement?: string
  tags?: Tag[]
  like_count?: number
  comment_count?: number
  impl_working?: number
  impl_not_working?: number
  impl_stuck?: number
}

export type Tag = {
  id: string
  name: string
  created_at: string
}

export type Like = {
  id: string
  idea_id: string
  person_name: string
  created_at: string
}

export type Comment = {
  id: string
  idea_id: string
  person_name: string
  content: string
  created_at: string
}

export type ImplementationReport = {
  id: string
  idea_id: string
  person_name: string
  status: 'working' | 'not_working' | 'stuck'
  created_at: string
}
