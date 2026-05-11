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
  created_at: string
  updated_at: string
  tags?: Tag[]
  like_count?: number
  comment_count?: number
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
