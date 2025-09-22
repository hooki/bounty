-- 이슈 작성자가 프로젝트 가시성 변경 후에도 프로젝트 정보를 조회할 수 있도록 RLS 정책 수정

-- 1. 기존 프로젝트 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view projects based on visibility" ON projects;

-- 2. 새로운 프로젝트 SELECT 정책 생성 (이슈 작성자 조건 추가)
CREATE POLICY "Users can view projects based on visibility" ON projects
FOR SELECT USING (
  -- 프로젝트 소유자는 항상 접근 가능
  (owner_id = auth.uid()) OR

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
  (visibility = 'private' AND owner_id = auth.uid()) OR

  -- 이슈 작성자: 자신이 작성한 이슈가 있는 프로젝트는 가시성과 관계없이 조회 가능
  -- (이슈 상세 페이지에서 프로젝트 정보를 표시하기 위해 필요)
  (id IN (
    SELECT DISTINCT project_id
    FROM issues
    WHERE reporter_id = auth.uid()
  ))
);