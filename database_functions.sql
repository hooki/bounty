-- 리더보드 조회 함수 (보상 대상 이슈만 포함)
CREATE OR REPLACE FUNCTION get_project_leaderboard()
RETURNS TABLE (
  project_id TEXT,
  project_title TEXT,
  user_id TEXT,
  username TEXT,
  avatar_url TEXT,
  total_issues BIGINT,
  valid_issues BIGINT,
  critical_issues BIGINT,
  high_issues BIGINT,
  medium_issues BIGINT,
  low_issues BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as project_id,
    p.title as project_title,
    u.id as user_id,
    u.username,
    u.avatar_url,
    COUNT(i.id) as total_issues,
    COUNT(CASE WHEN i.status IN ('solved', 'acknowledged') THEN 1 END) as valid_issues,
    COUNT(CASE WHEN i.severity = 'critical' AND i.status IN ('solved', 'acknowledged') THEN 1 END) as critical_issues,
    COUNT(CASE WHEN i.severity = 'high' AND i.status IN ('solved', 'acknowledged') THEN 1 END) as high_issues,
    COUNT(CASE WHEN i.severity = 'medium' AND i.status IN ('solved', 'acknowledged') THEN 1 END) as medium_issues,
    COUNT(CASE WHEN i.severity = 'low' AND i.status IN ('solved', 'acknowledged') THEN 1 END) as low_issues
  FROM
    projects p
    INNER JOIN issues i ON p.id = i.project_id
    INNER JOIN users u ON i.reporter_id = u.id
  GROUP BY
    p.id, p.title, u.id, u.username, u.avatar_url
  HAVING
    COUNT(CASE WHEN i.status IN ('solved', 'acknowledged') THEN 1 END) > 0
  ORDER BY
    COUNT(CASE WHEN i.status IN ('solved', 'acknowledged') THEN 1 END) DESC,
    COUNT(i.id) DESC;
END;
$$ LANGUAGE plpgsql;