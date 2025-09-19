# 소스코드 보안 감사 플랫폼

내부 개발자 전용 소스코드 보안 감사 및 버그 바운티 플랫폼입니다.

## 주요 기능

- **GitHub OAuth 인증**: 특정 조직 단위로만 접근 가능
- **프로젝트 관리**: GitHub 저장소 연동으로 감사 프로젝트 생성
- **이슈 관리**: 마크다운 지원 보안 이슈 보고 및 관리
- **보상 시스템**: 심각도별 보상 풀 자동 분배
- **리더보드**: 실시간 참여자 순위 및 예상 보상 확인
- **GitHub 연동**: 이슈를 GitHub Issue로 발행 가능

## 기술 스택

- **Frontend**: React 19, TypeScript, RSBuild
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + RLS)
- **Authentication**: GitHub OAuth via Supabase Auth
- **Router**: React Router DOM

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectList.tsx
│   ├── IssueForm.tsx
│   ├── IssueList.tsx
│   ├── Leaderboard.tsx
│   └── RewardBreakdown.tsx
├── contexts/           # React Context
│   └── AuthContext.tsx
├── hooks/              # 커스텀 훅
│   ├── useProjects.ts
│   ├── useIssues.ts
│   ├── useGitHub.ts
│   └── useLeaderboard.ts
├── pages/              # 페이지 컴포넌트
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── IssuesPage.tsx
│   └── LeaderboardPage.tsx
├── lib/                # 유틸리티
│   └── supabase.ts
└── App.tsx             # 메인 앱 컴포넌트
```

## 설정 방법

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

### 2. 환경 변수 (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
VITE_ALLOWED_ORGANIZATIONS=your-org1,your-org2
```

### 3. Supabase 설정

1. **프로젝트 생성**: [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. **데이터베이스 설정**: `database.sql` 파일 실행
3. **함수 생성**: `database-functions.sql` 파일 실행
4. **GitHub OAuth 설정**:
   - Authentication > Providers에서 GitHub 활성화
   - GitHub OAuth App 생성 및 클라이언트 ID/Secret 설정

### 4. GitHub OAuth App 설정

1. GitHub > Settings > Developer settings > OAuth Apps에서 새 앱 생성
2. **Authorization callback URL**: `https://your-supabase-url.co/auth/v1/callback`
3. 클라이언트 ID를 환경 변수에 설정

## 개발 실행

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 미리보기
npm run preview
```

## 데이터베이스 스키마

### 주요 테이블

- **users**: 사용자 정보 (GitHub 프로필 데이터)
- **projects**: 프로젝트 메타데이터 및 보상 구조
- **issues**: 보안 이슈, 상태, 심각도, 변경 기록
- **comments**: 이슈 논의 및 변경 기록 자동 코멘트

### RLS (Row Level Security) 정책

- 조직 단위 데이터 접근 제어
- 프로젝트 소유자 권한 관리
- 이슈 작성자/프로젝트 소유자 수정 권한

## 보상 시스템

### 보상 계산 로직

1. 프로젝트 생성 시 총 보상 풀과 심각도별 분배 설정
2. 같은 심각도의 이슈는 해당 보상 풀을 균등 분배
3. 'solved' 또는 'acknowledged' 상태의 이슈만 보상 대상
4. 프로젝트 종료 시 최종 보상 확정

### 예시

- 총 보상 풀: $10,000
- Critical: $5,000 (2개 이슈) → 각 $2,500
- High: $3,000 (3개 이슈) → 각 $1,000
- Medium: $1,500 (5개 이슈) → 각 $300
- Low: $500 (10개 이슈) → 각 $50

## 배포

### Vercel (권장)

1. **환경 변수 설정**:
   - Vercel Dashboard > Project Settings > Environment Variables
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가

2. **자동 배포**:
   ```bash
   # GitHub 연동으로 자동 배포
   git push origin main
   ```

3. **수동 배포**:
   ```bash
   # Vercel CLI 설치
   npm i -g vercel

   # 배포
   vercel --prod
   ```

4. **중요 설정**:
   - `vercel.json`에서 SPA 라우팅 설정됨
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 배포 시 주의사항

- ✅ `vercel.json` 파일 포함 (SPA 라우팅 지원)
- ✅ 환경 변수 설정 필수
- ✅ Supabase URL과 도메인 CORS 설정 확인

### 기타 플랫폼

빌드된 `dist` 폴더를 정적 호스팅 서비스에 업로드
- Netlify: `_redirects` 파일 필요
- GitHub Pages: HashRouter 사용 권장

## 보안 정책

- GitHub 조직 단위 접근 제한
- RLS를 통한 데이터 격리
- Private 저장소 접근 차단
- 세션 만료 없음 (내부 사용)

## 라이선스

이 프로젝트는 내부 사용을 위한 프로젝트입니다.