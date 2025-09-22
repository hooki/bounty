-- RLS INSERT 정책 수정

-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Project owners can insert projects" ON projects;

-- 새로운 INSERT 정책 생성 (allowed_organizations 필드 고려)
CREATE POLICY "Project owners can insert projects" ON projects
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- UPDATE 정책도 확인 및 업데이트
DROP POLICY IF EXISTS "Project owners can update their projects" ON projects;

CREATE POLICY "Project owners can update their projects" ON projects
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);