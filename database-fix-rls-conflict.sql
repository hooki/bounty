-- RLS 정책 충돌 해결

-- 1. 기존의 모든 SELECT 정책 삭제
DROP POLICY IF EXISTS "Anyone in organization can view projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects based on visibility" ON projects;

-- 2. 새로운 SELECT 정책 생성 (allowed_organizations 지원)
CREATE POLICY "Users can view projects based on visibility" ON projects
FOR SELECT USING (
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

  -- private: 소유자만
  (visibility = 'private' AND owner_id = auth.uid())
);

-- 3. INSERT/UPDATE 정책은 그대로 유지 (이미 올바르게 설정됨)
-- CREATE POLICY "Project owners can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Project owners can update their projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);