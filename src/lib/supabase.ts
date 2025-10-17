import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          github_id: number
          username: string
          avatar_url: string
          email: string
          organization: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          github_id: number
          username: string
          avatar_url: string
          email: string
          organization: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          github_id?: number
          username?: string
          avatar_url?: string
          email?: string
          organization?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          owner_id: string
          repository_url: string
          branch_name: string
          selected_files: string[]
          total_reward_pool: number
          reward_distribution: Record<string, number>
          reward_currency: "TON" | "USDC"
          status: "active" | "closed"
          visibility: "public" | "organization" | "private"
          allowed_organizations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          owner_id: string
          repository_url: string
          branch_name: string
          selected_files: string[]
          total_reward_pool: number
          reward_distribution: Record<string, number>
          reward_currency?: "TON" | "USDC"
          total_lines_of_code?: number
          status?: "active" | "closed"
          visibility?: "public" | "organization" | "private"
          allowed_organizations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          owner_id?: string
          repository_url?: string
          branch_name?: string
          selected_files?: string[]
          total_reward_pool?: number
          reward_distribution?: Record<string, number>
          reward_currency?: "TON" | "USDC"
          total_lines_of_code?: number
          status?: "active" | "closed"
          visibility?: "public" | "organization" | "private"
          allowed_organizations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          project_id: string
          reporter_id: string
          title: string
          description: string
          severity: "low" | "medium" | "high" | "critical"
          status:
            | "open"
            | "in_progress"
            | "solved"
            | "acknowledged"
            | "invalid"
            | "duplicated"
          github_issue_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          reporter_id: string
          title: string
          description: string
          severity: "low" | "medium" | "high" | "critical"
          status?:
            | "open"
            | "in_progress"
            | "solved"
            | "acknowledged"
            | "invalid"
            | "duplicated"
          github_issue_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          reporter_id?: string
          title?: string
          description?: string
          severity?: "low" | "medium" | "high" | "critical"
          status?:
            | "open"
            | "in_progress"
            | "solved"
            | "acknowledged"
            | "invalid"
            | "duplicated"
          github_issue_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          issue_id: string
          user_id: string
          content: string
          is_system_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          user_id: string
          content: string
          is_system_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          user_id?: string
          content?: string
          is_system_generated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
