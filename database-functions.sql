-- 프로젝트별 리더보드 함수
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
  GROUP BY p.id, p.title, u.id, u.username, u.avatar_url
  HAVING COUNT(i.id) > 0  -- 이슈가 있는 사용자만 표시
  ORDER BY valid_issues DESC, total_issues DESC;
$$;

-- 사용자별 프로젝트 통계 함수
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
      p.owner_id IN (
        SELECT id FROM users WHERE organization = (
          SELECT organization FROM users WHERE id = auth.uid()
        )
      )
    )
  GROUP BY p.id, p.title
  HAVING COUNT(i.id) > 0
  ORDER BY valid_issues DESC, total_issues DESC;
$$;