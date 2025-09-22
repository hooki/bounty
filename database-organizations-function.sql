-- 조직 목록 조회를 위한 안전한 함수 생성

-- 1. 기존 정책은 그대로 유지하고, 대신 함수를 통해 조직 목록 조회
CREATE OR REPLACE FUNCTION get_available_organizations()
RETURNS TABLE (organization_name TEXT)
LANGUAGE SQL
SECURITY DEFINER  -- 함수 소유자 권한으로 실행 (RLS 우회)
AS $$
  SELECT DISTINCT organization
  FROM users
  WHERE organization IS NOT NULL AND organization != ''
  ORDER BY organization;
$$;

-- 2. 함수 실행 권한을 인증된 사용자에게 부여
GRANT EXECUTE ON FUNCTION get_available_organizations() TO authenticated;