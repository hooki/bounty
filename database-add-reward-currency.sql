-- projects 테이블에 reward_currency 컬럼 추가
ALTER TABLE projects
ADD COLUMN reward_currency TEXT NOT NULL DEFAULT 'TON'
CHECK (reward_currency IN ('TON', 'USDC'));

-- 기존 프로젝트들에 기본값(TON) 설정 (이미 DEFAULT로 설정되어 있지만 명시적으로 업데이트)
UPDATE projects
SET reward_currency = 'TON'
WHERE reward_currency IS NULL OR reward_currency = '';

-- 인덱스 추가 (선택사항: 리워드 통화별 필터링이 자주 발생할 경우)
CREATE INDEX idx_projects_reward_currency ON projects(reward_currency);
