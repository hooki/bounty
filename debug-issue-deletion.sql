-- 이슈 테이블의 현재 RLS 정책들 확인 및 삭제 정책 재설정

-- 1. 현재 이슈 테이블의 모든 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'issues';

-- 2. 기존 DELETE 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Issue reporters can delete their issues" ON issues;

-- 3. 새로운 DELETE 정책 생성 (더 명확한 조건)
CREATE POLICY "Issue reporters can delete their issues" ON issues
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = reporter_id
);

-- 4. 삭제 테스트를 위한 임시 함수 (디버깅용)
CREATE OR REPLACE FUNCTION debug_delete_issue(issue_id_param UUID)
RETURNS TABLE (
  can_delete BOOLEAN,
  current_user_id UUID,
  issue_reporter_id UUID,
  issue_exists BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_uid UUID;
  reporter_uid UUID;
  issue_count INTEGER;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_uid := auth.uid();

  -- 이슈 존재 여부 및 reporter_id 확인
  SELECT COUNT(*), MAX(reporter_id) INTO issue_count, reporter_uid
  FROM issues
  WHERE id = issue_id_param;

  RETURN QUERY SELECT
    (current_uid IS NOT NULL AND current_uid = reporter_uid AND issue_count > 0) as can_delete,
    current_uid as current_user_id,
    reporter_uid as issue_reporter_id,
    (issue_count > 0) as issue_exists,
    CASE
      WHEN current_uid IS NULL THEN 'User not authenticated'
      WHEN issue_count = 0 THEN 'Issue does not exist'
      WHEN current_uid != reporter_uid THEN 'User is not the reporter'
      ELSE 'Should be able to delete'
    END as error_message;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION debug_delete_issue(UUID) TO authenticated;