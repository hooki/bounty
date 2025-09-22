-- 이슈 삭제를 위한 RLS 정책 생성

-- 1. 기존 DELETE 정책이 있다면 삭제
DROP POLICY IF EXISTS "Issue reporters can delete their issues" ON issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON issues;

-- 2. 이슈 작성자만 자신의 이슈를 삭제할 수 있는 정책 생성
CREATE POLICY "Issue reporters can delete their own issues" ON issues
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = reporter_id
);