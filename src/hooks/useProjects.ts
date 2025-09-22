import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { Database } from "../lib/supabase"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)

      // 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        console.warn("No active session found for projects fetch")
        setProjects([])
        return
      }

      // 현재 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, organization")
        .eq("id", session.user.id)
        .single()

      if (userError) {
        throw userError
      }

      // 프로젝트 조회 (가시성 기반 필터링)
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
        *,
        owner:users!projects_owner_id_fkey(username, avatar_url, 
    organization)
      `
        )
        .order("created_at", { ascending: false })

      if (error) {
        // 세션 관련 오류인 경우 재시도
        if (error.message.includes("JWT") && retryCount < 2) {
          console.log(`Retrying projects fetch, attempt ${retryCount + 1}`)
          setTimeout(() => fetchProjects(retryCount + 1), 1000)
          return
        }
        throw error
      }

      setProjects((data || []) as any)
    } catch (error) {
      console.error("Project fetch error:", error)
      setError(
        error instanceof Error ? error.message : "Failed to load projects."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async (
    projectData: Omit<ProjectInsert, "owner_id">
  ) => {
    try {
      // 세션과 사용자 정보 재확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error("Authentication required. Please log in again.")
      }

      // 사용자 프로필이 존재하는지 확인
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      console.log(user.id)

      if (profileError || !userProfile) {
        console.log(profileError)
        throw new Error("User profile not found. Please refresh and try again.")
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...projectData,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      await fetchProjects() // 목록 새로고침
      return data
    } catch (error) {
      console.error("Project creation error:", error)
      throw error
    }
  }

  const updateProjectStatus = async (
    projectId: string,
    status: "active" | "closed"
  ) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", projectId)

      if (error) throw error

      await fetchProjects() // 목록 새로고침
    } catch (error) {
      console.error("Project status update error:", error)
      throw error
    }
  }

  const updateProjectVisibility = async (
    projectId: string,
    visibility: "public" | "organization" | "private"
  ) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ visibility })
        .eq("id", projectId)

      if (error) throw error

      await fetchProjects() // 목록 새로고침
    } catch (error) {
      console.error("Project visibility update error:", error)
      throw error
    }
  }

  const updateProjectOrganizations = async (
    projectId: string,
    allowedOrganizations: string | null
  ) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ allowed_organizations: allowedOrganizations })
        .eq("id", projectId)

      if (error) throw error

      await fetchProjects() // 목록 새로고침
    } catch (error) {
      console.error("Project organizations update error:", error)
      throw error
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProjectStatus,
    updateProjectVisibility,
    updateProjectOrganizations,
    refetch: fetchProjects,
  }
}
