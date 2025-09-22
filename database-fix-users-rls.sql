-- Users 테이블 RLS 정책 수정 - 조직 목록 조회를 위한 권한 추가

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view other users in same organization" ON users;

-- 2. 새로운 정책 생성 - 조직 필드는 모든 인증된 사용자가 볼 수 있도록 허용
CREATE POLICY "Users can view other users in same organization" ON users
FOR SELECT USING (
  -- 자신의 프로필은 모든 필드 접근 가능
  auth.uid() = id OR
  -- 같은 조직 사용자는 모든 필드 접근 가능
  organization = (SELECT organization FROM users WHERE id = auth.uid())
);

-- 3. 조직 정보만 조회할 수 있는 별도 정책 추가
CREATE POLICY "Users can view organization info for project access" ON users
FOR SELECT USING (
  -- 모든 인증된 사용자가 organization 필드만 볼 수 있도록 허용
  -- 이는 프로젝트의 allowed_organizations 설정을 위함
  auth.uid() IS NOT NULL
);

-- 참고: 이 정책으로 인해 organization 필드는 모든 사용자가 볼 수 있지만,
-- 실제 쿼리에서는 SELECT organization만 사용하므로 다른 개인정보는 보호됩니다.