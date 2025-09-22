-- 이슈 SELECT에서 프로젝트 가시성 범위 적용하도록 RLS 정책 변경

-- 1. 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view issues based on project access and status" ON issues;
DROP POLICY IF EXISTS "Users can view issues based on project visibility" ON issues;

-- 2. 새로운 SELECT 정책 생성 (모든 이슈에 프로젝트 가시성 적용)
CREATE POLICY "Users can view issues based on project visibility" ON issues
FOR SELECT
USING (
  -- 이슈 작성자는 항상 자신의 이슈를 볼 수 있음
  (reporter_id = auth.uid()) OR

  -- 프로젝트 가시성에 따른 접근 제어
  (project_id IN (
    SELECT p.id
    FROM projects p
    WHERE
      -- 1. 프로젝트 소유자는 항상 접근 가능 (private, organization, public 모두)
      (p.owner_id = auth.uid()) OR

      -- 2. public 프로젝트는 모든 사용자가 접근 가능
      (p.visibility = 'public') OR

      -- 3. organization 프로젝트는 조직 멤버만 접근 가능
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

      -- 4. private 프로젝트는 위의 1번 조건 (소유자)에서만 접근 가능
      -- visibility = 'private'인 경우 위의 2, 3번 조건에 해당하지 않으므로
      -- 오직 owner_id = auth.uid() 조건에서만 true가 됨
  ))
);