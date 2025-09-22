-- 프로젝트 소유자는 항상 자신의 프로젝트에 접근 가능하도록 RLS 정책 수정

-- 1. 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view projects based on visibility" ON projects;

-- 2. 새로운 SELECT 정책 생성 (프로젝트 소유자 접근 권한 추가)
CREATE POLICY "Users can view projects based on visibility" ON projects
FOR SELECT USING (
  -- 프로젝트 소유자는 항상 접근 가능
  (auth.uid() = owner_id) OR

  -- public: 모든 인증된 사용자
  (visibility = 'public' AND auth.uid() IS NOT NULL) OR

  -- organization: 허용된 조직 또는 owner 조직
  (visibility = 'organization' AND (
    -- allowed_organizations가 설정된 경우 (콤마 구분 문자열에서 현재 사용자 조직 검색)
    (allowed_organizations IS NOT NULL AND
     position((SELECT organization FROM users WHERE id = auth.uid()) || ',' IN allowed_organizations || ',') > 0)
    OR
    -- allowed_organizations가 NULL인 경우 (기존 방식)
    (allowed_organizations IS NULL AND owner_id IN (
      SELECT id FROM users WHERE organization = (
        SELECT organization FROM users WHERE id = auth.uid()
      )
    ))
  )) OR

  -- private: 소유자만 (이미 위에서 처리되었지만 명시적으로 유지)
  (visibility = 'private' AND owner_id = auth.uid())
);