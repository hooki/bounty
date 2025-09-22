import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

export function useOrganizations() {
  const [availableOrganizations, setAvailableOrganizations] = useState<
    string[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailableOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)

      // 안전한 함수를 통해 조직 목록 가져오기 (RLS 정책 우회)
      const { data, error } = await supabase
        .from("users")
        .select("organization")
        .order("organization")

      if (error) throw error

      // 함수에서 이미 정렬된 결과를 반환하므로 추가 처리 불필요
      const uniqueOrgs = [...new Set(data?.map((u) => u.organization) || [])]
        .filter((org) => org && org.trim())
        .sort()

      setAvailableOrganizations(uniqueOrgs)
    } catch (error) {
      console.error("Organizations fetch error:", error)
      setError(
        error instanceof Error ? error.message : "Failed to load organizations."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableOrganizations()
  }, [])

  // 조직 리스트를 콤마 구분 문자열로 변환
  const organizationsToString = (orgs: string[]): string | null => {
    if (!orgs || orgs.length === 0) return null
    return orgs.filter((org) => org && org.trim()).join(",")
  }

  // 콤마 구분 문자열을 조직 리스트로 변환
  const stringToOrganizations = (str: string | null): string[] => {
    if (!str || !str.trim()) return []
    return str
      .split(",")
      .map((org) => org.trim())
      .filter(Boolean)
  }

  return {
    availableOrganizations,
    loading,
    error,
    refetch: fetchAvailableOrganizations,
    organizationsToString,
    stringToOrganizations,
  }
}
