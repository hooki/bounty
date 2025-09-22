-- 이슈 권한 정책 재설계
-- 이슈 작성자: 삭제만 가능, 내용 변경 불가
-- 프로젝트 소유자: severity만 변경 가능

-- 1. 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Issue reporters and project owners can update issues" ON issues;
DROP POLICY IF EXISTS "Issue update permissions based on role" ON issues;

-- 2. DELETE 정책 생성 (이슈 작성자만 삭제 가능)
DROP POLICY IF EXISTS "Issue reporters can delete their issues" ON issues;
CREATE POLICY "Issue reporters can delete their issues" ON issues
FOR DELETE
USING (auth.uid() = reporter_id);

-- 3. UPDATE 정책 생성 (아무도 직접 UPDATE 불가)
-- 모든 UPDATE를 차단하고 대신 함수를 통해서만 가능하도록 함
CREATE POLICY "No direct updates allowed on issues" ON issues
FOR UPDATE
USING (FALSE);

-- 4. 프로젝트 소유자만 severity 변경 가능한 함수
CREATE OR REPLACE FUNCTION update_issue_severity(
  issue_id UUID,
  new_severity TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_owner_id UUID;
BEGIN
  -- 해당 이슈의 프로젝트 소유자 확인
  SELECT p.owner_id INTO project_owner_id
  FROM issues i
  JOIN projects p ON i.project_id = p.id
  WHERE i.id = issue_id;

  -- 현재 사용자가 프로젝트 소유자인지 확인
  IF auth.uid() != project_owner_id THEN
    RAISE EXCEPTION 'Only project owners can update issue severity';
  END IF;

  -- 중요도가 유효한 값인지 확인
  IF new_severity NOT IN ('low', 'medium', 'high', 'critical') THEN
    RAISE EXCEPTION 'Invalid severity value: %', new_severity;
  END IF;

  -- 중요도 업데이트 (RLS 우회하여 직접 업데이트)
  UPDATE issues
  SET
    severity = new_severity,
    updated_at = NOW()
  WHERE id = issue_id;

  -- 업데이트가 실제로 수행되었는지 확인
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found: %', issue_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 5. 이슈 상태 변경 함수 (프로젝트 소유자만 가능)
CREATE OR REPLACE FUNCTION update_issue_status(
  issue_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_owner_id UUID;
BEGIN
  -- 해당 이슈의 프로젝트 소유자 확인
  SELECT p.owner_id INTO project_owner_id
  FROM issues i
  JOIN projects p ON i.project_id = p.id
  WHERE i.id = issue_id;

  -- 현재 사용자가 프로젝트 소유자인지 확인
  IF auth.uid() != project_owner_id THEN
    RAISE EXCEPTION 'Only project owners can update issue status';
  END IF;

  -- 상태가 유효한 값인지 확인
  IF new_status NOT IN ('open', 'in_progress', 'solved', 'acknowledged', 'invalid', 'duplicated') THEN
    RAISE EXCEPTION 'Invalid status value: %', new_status;
  END IF;

  -- 상태 업데이트
  UPDATE issues
  SET
    status = new_status,
    updated_at = NOW()
  WHERE id = issue_id;

  -- 업데이트가 실제로 수행되었는지 확인
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found: %', issue_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 6. GitHub 이슈 URL 업데이트 함수 (프로젝트 소유자만 가능)
CREATE OR REPLACE FUNCTION update_issue_github_url(
  issue_id UUID,
  new_github_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_owner_id UUID;
BEGIN
  -- 해당 이슈의 프로젝트 소유자 확인
  SELECT p.owner_id INTO project_owner_id
  FROM issues i
  JOIN projects p ON i.project_id = p.id
  WHERE i.id = issue_id;

  -- 현재 사용자가 프로젝트 소유자인지 확인
  IF auth.uid() != project_owner_id THEN
    RAISE EXCEPTION 'Only project owners can update GitHub issue URL';
  END IF;

  -- GitHub URL 업데이트
  UPDATE issues
  SET
    github_issue_url = new_github_url,
    updated_at = NOW()
  WHERE id = issue_id;

  -- 업데이트가 실제로 수행되었는지 확인
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found: %', issue_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 7. 함수 실행 권한을 인증된 사용자에게 부여
GRANT EXECUTE ON FUNCTION update_issue_severity(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_issue_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_issue_github_url(UUID, TEXT) TO authenticated;

-- 8. 기존 SELECT, INSERT 정책은 그대로 유지
-- SELECT: 조직 내 사용자들이 볼 수 있음
-- INSERT: 조직 내 사용자들이 생성 가능
-- DELETE: 이슈 작성자만 삭제 가능
-- UPDATE: 함수를 통해서만 가능 (프로젝트 소유자만)