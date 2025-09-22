-- 이슈 삭제를 위한 안전한 함수 생성

CREATE OR REPLACE FUNCTION delete_issue_safe(issue_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_uid UUID;
  issue_reporter_id UUID;
  deleted_count INTEGER;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_uid := auth.uid();

  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 이슈의 reporter_id 확인
  SELECT reporter_id INTO issue_reporter_id
  FROM issues
  WHERE id = issue_id_param;

  IF issue_reporter_id IS NULL THEN
    RAISE EXCEPTION 'Issue not found';
  END IF;

  IF current_uid != issue_reporter_id THEN
    RAISE EXCEPTION 'Only issue reporter can delete the issue';
  END IF;

  -- 이슈 삭제 (RLS 우회)
  DELETE FROM issues
  WHERE id = issue_id_param
  AND reporter_id = current_uid;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RAISE EXCEPTION 'Failed to delete issue';
  END IF;

  RETURN TRUE;
END;
$$;

-- 함수 실행 권한을 인증된 사용자에게 부여
GRANT EXECUTE ON FUNCTION delete_issue_safe(UUID) TO authenticated;