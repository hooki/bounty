-- 이슈 중요도 변경은 프로젝트 소유자만 가능하도록 RLS 정책 수정

-- 1. 기존 UPDATE 정책 확인 및 삭제
DROP POLICY IF EXISTS "Issue reporters and project owners can update issues" ON issues;

-- 2. 새로운 UPDATE 정책 생성
-- 이슈 신고자는 중요도(severity)를 제외한 필드만 수정 가능
-- 프로젝트 소유자는 모든 필드 수정 가능
CREATE POLICY "Issue update permissions based on role" ON issues
FOR UPDATE
USING (
  -- 이슈 신고자이거나 프로젝트 소유자인 경우
  auth.uid() = reporter_id OR
  auth.uid() = (SELECT owner_id FROM projects WHERE id = project_id)
)
WITH CHECK (
  -- 이슈 신고자의 경우: severity 필드 변경 불가
  (auth.uid() = reporter_id AND
   severity = (SELECT severity FROM issues WHERE id = issues.id)) OR

  -- 프로젝트 소유자의 경우: 모든 필드 변경 가능
  (auth.uid() = (SELECT owner_id FROM projects WHERE id = project_id))
);

-- 3. 중요도 변경을 위한 별도 함수 생성 (프로젝트 소유자만 실행 가능)
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
    RAISE EXCEPTION 'Invalid severity value';
  END IF;

  -- 중요도 업데이트
  UPDATE issues
  SET severity = new_severity
  WHERE id = issue_id;

  RETURN TRUE;
END;
$$;

-- 4. 함수 실행 권한을 인증된 사용자에게 부여
GRANT EXECUTE ON FUNCTION update_issue_severity(UUID, TEXT) TO authenticated;