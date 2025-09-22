# 배포 가이드

## Supabase 설정

### 1. 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 anon key 확인

### 2. 데이터베이스 설정

SQL 에디터에서 다음 파일들을 순서대로 실행:

1. `database.sql` - 기본 테이블 및 RLS 정책
2. `database-functions.sql` - 리더보드 함수

### 3. GitHub OAuth 설정

1. **Supabase 설정**:
   - Authentication > Providers > GitHub 활성화
   - Redirect URLs에 사이트 도메인 추가

2. **GitHub OAuth App 생성**:
   - GitHub > Settings > Developer settings > OAuth Apps
   - New OAuth App 클릭
   - Application name: "소스코드 보안 감사 플랫폼"
   - Homepage URL: 배포할 도메인
   - Authorization callback URL: `https://[your-project].supabase.co/auth/v1/callback`
   - 생성 후 Client ID와 Client Secret을 Supabase에 설정

## 환경 변수 설정

### 로컬 개발용 (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_ALLOWED_ORGANIZATIONS=tokamak,your-org-2
```

### 프로덕션용

배포 플랫폼의 환경 변수 설정에서 동일한 값들을 설정

## Vercel 배포

### 1. 저장소 연결

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel

# 환경 변수 설정
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GITHUB_CLIENT_ID
vercel env add VITE_ALLOWED_ORGANIZATIONS

# 배포
vercel --prod
```

### 2. 대시보드 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 프로젝트 선택
2. Settings > Environment Variables에서 환경 변수 확인
3. Settings > Git에서 자동 배포 설정

## Netlify 배포

### 1. 사이트 생성

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 빌드
npm run build

# 배포
netlify deploy --prod --dir=dist
```

### 2. 환경 변수 설정

1. Netlify Dashboard > Site settings > Environment variables
2. 필요한 환경 변수들 추가

## 기타 정적 호스팅

### 1. 빌드

```bash
npm run build
```

### 2. 업로드

`dist` 폴더의 내용을 다음 서비스들에 업로드:

- **Firebase Hosting**
- **AWS S3 + CloudFront**
- **GitHub Pages**
- **Surge.sh**

## 도메인 설정

### 1. DNS 설정

배포 플랫폼에서 제공하는 도메인을 사용하거나 커스텀 도메인 연결

### 2. HTTPS 설정

대부분의 플랫폼에서 자동으로 Let's Encrypt SSL 인증서 제공

### 3. 리다이렉트 설정

SPA를 위한 리다이렉트 설정:

**Vercel (vercel.json)**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Netlify (_redirects)**:
```
/*    /index.html   200
```

## 보안 체크리스트

### 배포 전 확인사항

- [ ] 환경 변수가 올바르게 설정되었는지 확인
- [ ] GitHub OAuth 콜백 URL이 배포 도메인과 일치하는지 확인
- [ ] 허용된 조직 목록이 정확한지 확인
- [ ] Supabase RLS 정책이 활성화되었는지 확인
- [ ] Private 저장소 접근이 차단되는지 테스트

### 배포 후 확인사항

- [ ] 로그인/로그아웃이 정상 작동하는지 확인
- [ ] 조직 외부 사용자의 접근이 차단되는지 확인
- [ ] 프로젝트 생성/수정이 정상 작동하는지 확인
- [ ] 이슈 생성/수정이 정상 작동하는지 확인
- [ ] GitHub Issue 발행이 정상 작동하는지 확인
- [ ] 리더보드 계산이 정확한지 확인

## 모니터링

### 로그 확인

1. **Supabase**: Dashboard > Logs에서 데이터베이스 쿼리 로그 확인
2. **Vercel**: Dashboard > Functions 탭에서 함수 로그 확인
3. **브라우저**: 개발자 도구 콘솔에서 클라이언트 오류 확인

### 성능 모니터링

1. **Core Web Vitals**: 배포 플랫폼의 Analytics 확인
2. **Database Performance**: Supabase Dashboard에서 성능 지표 확인

## 백업

### 데이터베이스 백업

```sql
-- 정기적으로 실행하여 데이터 백업
pg_dump [connection_string] > backup.sql
```

### 환경 설정 백업

환경 변수와 설정 파일들을 안전한 곳에 보관

## 업데이트

### 코드 업데이트

```bash
# 최신 코드 반영
git pull origin main

# 의존성 업데이트
npm update

# 빌드 및 배포
npm run build
vercel --prod
```

### 데이터베이스 마이그레이션

새로운 기능 추가 시 필요한 테이블 변경사항을 SQL로 작성하여 실행