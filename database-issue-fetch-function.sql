-- 이슈 조회 시 접근 권한에 따라 프로젝트 필드를 선택적으로 반환하는 함수

CREATE OR REPLACE FUNCTION get_issues_with_project_info(project_filter UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  severity TEXT,
  status TEXT,
  github_issue_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  project_id UUID,
  reporter_id UUID,
  reporter_username TEXT,
  reporter_avatar_url TEXT,
  project_title TEXT,
  project_owner_id UUID,
  project_repository_url TEXT,
  can_access_project BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.description,
    i.severity,
    i.status,
    i.github_issue_url,
    i.created_at,
    i.updated_at,
    i.project_id,
    i.reporter_id,
    u.username as reporter_username,
    u.avatar_url as reporter_avatar_url,
    -- 프로젝트 정보는 접근 권한에 따라 조건부 반환
    CASE
      WHEN (
        -- 프로젝트 소유자
        p.owner_id = auth.uid() OR
        -- 이슈 작성자
        i.reporter_id = auth.uid() OR
        -- public 프로젝트
        p.visibility = 'public' OR
        -- organization 프로젝트 (허용된 조직)
        (p.visibility = 'organization' AND (
          (p.allowed_organizations IS NOT NULL AND
           position((SELECT u2.organization FROM users u2 WHERE u2.id = auth.uid()) || ',' IN p.allowed_organizations || ',') > 0) OR
          (p.allowed_organizations IS NULL AND p.owner_id IN (
            SELECT u3.id FROM users u3 WHERE u3.organization = (SELECT u4.organization FROM users u4 WHERE u4.id = auth.uid())
          ))
        ))
      ) THEN p.title
      ELSE '[Private Project]'
    END as project_title,
    CASE
      WHEN (
        p.owner_id = auth.uid() OR
        i.reporter_id = auth.uid() OR
        p.visibility = 'public' OR
        (p.visibility = 'organization' AND (
          (p.allowed_organizations IS NOT NULL AND
           position((SELECT u2.organization FROM users u2 WHERE u2.id = auth.uid()) || ',' IN p.allowed_organizations || ',') > 0) OR
          (p.allowed_organizations IS NULL AND p.owner_id IN (
            SELECT u3.id FROM users u3 WHERE u3.organization = (SELECT u4.organization FROM users u4 WHERE u4.id = auth.uid())
          ))
        ))
      ) THEN p.owner_id
      ELSE NULL
    END as project_owner_id,
    CASE
      WHEN (
        p.owner_id = auth.uid() OR
        i.reporter_id = auth.uid() OR
        p.visibility = 'public' OR
        (p.visibility = 'organization' AND (
          (p.allowed_organizations IS NOT NULL AND
           position((SELECT u2.organization FROM users u2 WHERE u2.id = auth.uid()) || ',' IN p.allowed_organizations || ',') > 0) OR
          (p.allowed_organizations IS NULL AND p.owner_id IN (
            SELECT u3.id FROM users u3 WHERE u3.organization = (SELECT u4.organization FROM users u4 WHERE u4.id = auth.uid())
          ))
        ))
      ) THEN p.repository_url
      ELSE NULL
    END as project_repository_url,
    -- 프로젝트 접근 가능 여부
    CASE
      WHEN (
        p.owner_id = auth.uid() OR
        p.visibility = 'public' OR
        (p.visibility = 'organization' AND (
          (p.allowed_organizations IS NOT NULL AND
           position((SELECT u2.organization FROM users u2 WHERE u2.id = auth.uid()) || ',' IN p.allowed_organizations || ',') > 0) OR
          (p.allowed_organizations IS NULL AND p.owner_id IN (
            SELECT u3.id FROM users u3 WHERE u3.organization = (SELECT u4.organization FROM users u4 WHERE u4.id = auth.uid())
          ))
        ))
      ) THEN TRUE
      ELSE FALSE
    END as can_access_project
  FROM issues i
  JOIN users u ON i.reporter_id = u.id
  JOIN projects p ON i.project_id = p.id
  WHERE
    -- 이슈 접근 권한 체크 (Open 상태 이슈 제한 포함)
    (
      -- Open 상태가 아닌 이슈: 기존 규칙 적용
      (i.status != 'open' AND (
        -- 이슈 작성자
        i.reporter_id = auth.uid() OR
        -- 프로젝트 접근 가능한 경우
        (
          p.owner_id = auth.uid() OR
          p.visibility = 'public' OR
          (p.visibility = 'organization' AND (
            (p.allowed_organizations IS NOT NULL AND
             position((SELECT u2.organization FROM users u2 WHERE u2.id = auth.uid()) || ',' IN p.allowed_organizations || ',') > 0) OR
            (p.allowed_organizations IS NULL AND p.owner_id IN (
              SELECT u3.id FROM users u3 WHERE u3.organization = (SELECT u4.organization FROM users u4 WHERE u4.id = auth.uid())
            ))
          ))
        )
      )) OR

      -- Open 상태 이슈: 이슈 작성자와 프로젝트 소유자만
      (i.status = 'open' AND (
        i.reporter_id = auth.uid() OR
        p.owner_id = auth.uid()
      ))
    )
    AND (project_filter IS NULL OR i.project_id = project_filter)
  ORDER BY i.created_at DESC;
END;
$$;

-- 함수 실행 권한을 인증된 사용자에게 부여
GRANT EXECUTE ON FUNCTION get_issues_with_project_info(UUID) TO authenticated;