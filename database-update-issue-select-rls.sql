-- Open 상태의 이슈는 작성자와 프로젝트 소유자만 볼 수 있도록 RLS 정책 수정

-- 1. 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view issues based on project visibility" ON issues;

-- 2. 새로운 SELECT 정책 생성 (Open 이슈 제한 추가)
CREATE POLICY "Users can view issues based on project visibility and status" ON issues
FOR SELECT
USING (
  -- Open 상태가 아닌 이슈: 기존 프로젝트 가시성 규칙 적용
  (status != 'open' AND (
    -- 이슈 작성자는 항상 자신의 이슈를 볼 수 있음
    (reporter_id = auth.uid()) OR

    -- 프로젝트 가시성에 따른 접근 제어
    (project_id IN (
      SELECT p.id
      FROM projects p
      WHERE
        -- 프로젝트 소유자는 항상 접근 가능
        (p.owner_id = auth.uid()) OR

        -- public 프로젝트는 모든 사용자가 접근 가능
        (p.visibility = 'public') OR

        -- organization 프로젝트는 조직 멤버만 접근 가능
        (p.visibility = 'organization' AND (
          -- allowed_organizations가 설정되지 않은 경우: 프로젝트 소유자와 같은 조직
          (p.allowed_organizations IS NULL AND
           EXISTS (
             SELECT 1 FROM users u1, users u2
             WHERE u1.id = p.owner_id
             AND u2.id = auth.uid()
             AND u1.organization = u2.organization
           )) OR
          -- allowed_organizations가 설정된 경우: 해당 조직 목록에 포함된 사용자
          (p.allowed_organizations IS NOT NULL AND
           position((SELECT organization FROM users WHERE id = auth.uid()) || ',' IN p.allowed_organizations || ',') > 0)
        ))

        -- private 프로젝트는 소유자만 접근 가능 (이미 위에서 체크됨)
    ))
  )) OR

  -- Open 상태 이슈: 이슈 작성자와 프로젝트 소유자만 볼 수 있음
  (status = 'open' AND (
    -- 이슈 작성자
    (reporter_id = auth.uid()) OR

    -- 프로젝트 소유자
    (project_id IN (
      SELECT p.id
      FROM projects p
      WHERE p.owner_id = auth.uid()
    ))
  ))
);