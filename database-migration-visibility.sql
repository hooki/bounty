-- 프로젝트 공개 범위 설정 기능 추가 마이그레이션

-- 1. visibility enum 타입 생성
CREATE TYPE project_visibility AS ENUM ('public', 'organization', 'private');

-- 2. projects 테이블에 visibility 컬럼 추가
ALTER TABLE projects
ADD COLUMN visibility project_visibility NOT NULL DEFAULT 'organization';

-- 3. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Anyone in organization can view projects" ON projects;

-- 4. 새로운 SELECT 정책 생성 (visibility 기반)
CREATE POLICY "Users can view projects based on visibility" ON projects
FOR SELECT USING (
  -- public: 모든 인증된 사용자
  (visibility = 'public' AND auth.uid() IS NOT NULL) OR

  -- organization: 같은 조직 사용자만
  (visibility = 'organization' AND owner_id IN (
    SELECT id FROM users WHERE organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
  )) OR

  -- private: 소유자만
  (visibility = 'private' AND owner_id = auth.uid())
);

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_projects_visibility ON projects(visibility);

-- 6. 함수 업데이트 - 리더보드 함수에서 visibility 고려
CREATE OR REPLACE FUNCTION get_project_leaderboard()
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_issues BIGINT,
  critical_issues BIGINT,
  high_issues BIGINT,
  medium_issues BIGINT,
  low_issues BIGINT,
  valid_issues BIGINT
)
LANGUAGE SQL
AS $$
  SELECT
    p.id as project_id,
    p.title as project_title,
    u.id as user_id,
    u.username,
    u.avatar_url,
    COUNT(i.id) as total_issues,
    COUNT(CASE WHEN i.severity = 'critical' THEN 1 END) as critical_issues,
    COUNT(CASE WHEN i.severity = 'high' THEN 1 END) as high_issues,
    COUNT(CASE WHEN i.severity = 'medium' THEN 1 END) as medium_issues,
    COUNT(CASE WHEN i.severity = 'low' THEN 1 END) as low_issues,
    COUNT(CASE WHEN i.status IN ('solved', 'acknowledged') THEN 1 END) as valid_issues
  FROM projects p
  CROSS JOIN users u
  LEFT JOIN issues i ON p.id = i.project_id AND i.reporter_id = u.id
  WHERE p.status = 'active'
    AND u.organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
    AND (
      -- RLS 정책과 동일한 조건 적용
      (p.visibility = 'public' AND auth.uid() IS NOT NULL) OR
      (p.visibility = 'organization' AND p.owner_id IN (
        SELECT id FROM users WHERE organization = (
          SELECT organization FROM users WHERE id = auth.uid()
        )
      )) OR
      (p.visibility = 'private' AND p.owner_id = auth.uid())
    )
  GROUP BY p.id, p.title, u.id, u.username, u.avatar_url
  HAVING COUNT(i.id) > 0
  ORDER BY valid_issues DESC, total_issues DESC;
$$;

-- 7. 사용자별 프로젝트 통계 함수도 업데이트
CREATE OR REPLACE FUNCTION get_user_project_stats(user_uuid UUID)
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  total_issues BIGINT,
  valid_issues BIGINT,
  estimated_reward NUMERIC
)
LANGUAGE SQL
AS $$
  SELECT
    p.id as project_id,
    p.title as project_title,
    COUNT(i.id) as total_issues,
    COUNT(CASE WHEN i.status IN ('solved', 'acknowledged') THEN 1 END) as valid_issues,
    0::NUMERIC as estimated_reward  -- 클라이언트에서 계산
  FROM projects p
  LEFT JOIN issues i ON p.id = i.project_id AND i.reporter_id = user_uuid
  WHERE p.status = 'active'
    AND (
      -- RLS 정책과 동일한 조건 적용
      (p.visibility = 'public' AND auth.uid() IS NOT NULL) OR
      (p.visibility = 'organization' AND p.owner_id IN (
        SELECT id FROM users WHERE organization = (
          SELECT organization FROM users WHERE id = auth.uid()
        )
      )) OR
      (p.visibility = 'private' AND p.owner_id = auth.uid())
    )
  GROUP BY p.id, p.title
  HAVING COUNT(i.id) > 0
  ORDER BY valid_issues DESC, total_issues DESC;
$$;