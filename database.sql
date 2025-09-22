-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_id BIGINT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  organization TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로젝트 테이블
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repository_url TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  selected_files TEXT[] DEFAULT '{}',
  total_reward_pool NUMERIC(15,2) NOT NULL CHECK (total_reward_pool >= 0),
  reward_distribution JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이슈 테이블
CREATE TABLE issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'solved', 'acknowledged', 'invalid', 'duplicated')),
  github_issue_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_system_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_organization ON users(organization);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책들

-- users 테이블 정책
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view other users in same organization" ON users FOR SELECT USING (
  organization = (SELECT organization FROM users WHERE id = auth.uid())
);

-- projects 테이블 정책
CREATE POLICY "Anyone in organization can view projects" ON projects FOR SELECT USING (
  owner_id IN (
    SELECT id FROM users WHERE organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "Project owners can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update their projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);

-- issues 테이블 정책
CREATE POLICY "Anyone in organization can view issues" ON issues FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE u.organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "Anyone in organization can create issues" ON issues FOR INSERT WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE u.organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
  ) AND auth.uid() = reporter_id
);
CREATE POLICY "Issue reporters and project owners can update issues" ON issues FOR UPDATE USING (
  auth.uid() = reporter_id OR
  auth.uid() = (SELECT owner_id FROM projects WHERE id = project_id)
);

-- comments 테이블 정책
CREATE POLICY "Anyone in organization can view comments" ON comments FOR SELECT USING (
  issue_id IN (
    SELECT i.id FROM issues i
    JOIN projects p ON i.project_id = p.id
    JOIN users u ON p.owner_id = u.id
    WHERE u.organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "Anyone in organization can create comments" ON comments FOR INSERT WITH CHECK (
  issue_id IN (
    SELECT i.id FROM issues i
    JOIN projects p ON i.project_id = p.id
    JOIN users u ON p.owner_id = u.id
    WHERE u.organization = (
      SELECT organization FROM users WHERE id = auth.uid()
    )
  ) AND auth.uid() = user_id
);
CREATE POLICY "Comment authors can update their comments" ON comments FOR UPDATE USING (
  auth.uid() = user_id AND NOT is_system_generated
);

-- 프로젝트별 리더보드 뷰 (실시간 계산)
CREATE OR REPLACE VIEW project_leaderboard AS
SELECT
  p.id as project_id,
  p.title as project_title,
  u.id as user_id,
  u.username,
  u.avatar_url,
  COUNT(i.id) as total_issues,
  COUNT(CASE WHEN i.severity = 'critical' THEN 1 END) as critical_issues,
  COUNT(CASE WHEN i.severity = 'high' THEN 1 END) as high_issues,
  COUNT(CASE WHEN i.severity = 'medium' THEN 1 END) as medium_issues,
  COUNT(CASE WHEN i.severity = 'low' THEN 1 END) as low_issues,
  COUNT(CASE WHEN i.status IN ('solved', 'acknowledged') THEN 1 END) as valid_issues
FROM projects p
LEFT JOIN issues i ON p.id = i.project_id AND i.status IN ('solved', 'acknowledged')
LEFT JOIN users u ON i.reporter_id = u.id
GROUP BY p.id, p.title, u.id, u.username, u.avatar_url
ORDER BY p.id, valid_issues DESC, total_issues DESC;