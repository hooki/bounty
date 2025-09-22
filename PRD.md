📑 소스코드 보안 감사 플랫폼 개발 계획 (보완 버전)

1. 개요

내부 개발자 전용 소스코드 보안 감사 플랫폼을 웹서비스로 개발한다. 이 플랫폼은 GitHub 인증을 기반으로 특정 조직 단위의 사용자만 접근 가능하며, 등록된 프로젝트를 중심으로 보안 이슈를 관리하고 보상 구조를 운영한다. 내부 개발자들은 다양한 국가의 인원들로 구성되어 있기 때문에 모든 컨텐츠는 영어로 작성해야 한다.

⸻

2. 접근 및 인증
	•	인증 방식: GitHub OAuth via Supabase Auth
	•	제한 조건: 특정 GitHub Organization 단위로만 접근 가능, 단 Organization이 all로 설정된 경우 모든 계정 접근 가능
	•	외부 협력자: 완전 차단 (guest/외부 초대 불가)
	•	세션 관리: 로그인 세션 만료 로직 없음

⸻

3. 프로젝트 관리
	•	등록:
	•	제목과 설명 입력 (설명은 Markdown 지원)
	•	사용자의 GitHub 저장소 리스트에서 감사 대상 저장소 선택 (Private Repo 제외)
	•	선택된 저장소의 브랜치/태그를 GitHub API를 통해 불러오기
	•	선택된 브랜치/태그의 소스코드를 트리 형태로 출력 → 특정 파일 체크 가능
	•	보상풀 총액 및 중요도별 배분 설정
	•	수정: 한 번 등록한 프로젝트는 수정 불가
	•	종료 시 처리: 종료된 프로젝트는 읽기 전용 상태로 계속 노출되며, 댓글 작성 불가
	•	리스트 기능: 프로젝트 리스트에서 정렬(상태, 보상 규모) 및 검색 기능 제공

⸻

4. 프로젝트 상세 화면
	•	프로젝트 정보(설명, 보상 풀 구조, 선택된 저장소/브랜치/파일)
	•	중요도별 보상 풀 표시
	•	리더보드
	•	프로젝트별로 생성
	•	참여자별 이슈 수량 및 프로젝트 종료 시 예상 보상 금액 표시
	•	실시간 반영 필요 없음 (새로고침 시 업데이트)

⸻

5. 이슈 관리
	•	생성:
	•	모든 프로젝트 참여자가 등록 가능
	•	마크다운 포맷 지원 (코드 블록을 지원해야함)
	•	Severity는 이슈 보고자가 직접 선택
	•	상태 관리:
	•	초기 상태: OPEN
	•	진행 중: IN-PROGRESS
	•	처리 결과: SOLVED / ACKNOWLEDGED / INVALID / DUPLICATED
	•	상태 변경 권한: 프로젝트 오너만 가능
	•	수정/삭제:
	•	작성자와 프로젝트 오너가 수정/삭제 가능
	•	변경 시 자동으로 “변경 내역”이 댓글로 기록 (삭제 불가)
	•	댓글:
	•	모든 참여자가 작성 가능
	•	변경 기록 자동 기록 코멘트는 누구도 삭제 불가
	•	외부 연동:
	•	각 이슈에 Publish 버튼 제공 → GitHub Issue로 등록됨
	•	GitHub Issue → 플랫폼 역동기화는 없음

⸻

6. 보상 시스템
	•	설정: 프로젝트 생성 시 총 보상 풀과 중요도별 보상풀 설정
	•	변경: 프로젝트 시작 후 수정 불가
	•	지급 방식: 관리자가 수동 정산
	•	배분 로직:
	•	같은 Severity 레벨의 이슈가 여러 개면 보상 풀을 균등 분배
	•	예: 총 $1M 중 Critical $500K, Critical 이슈 2개 → 각 $250K

⸻

7. 기술 스택
	•	Frontend: React 19, TypeScript, RSBuild
	•	Styling: TailwindCSS
	•	Backend: Supabase (PostgreSQL with RLS)
	•	Authentication: GitHub OAuth via Supabase Auth
	•	UI: Clean, responsive design
	•	Markdown: React Markdown + Syntax Highlighting (TS, JS, Solidity, Go, Python, ...)

✅ 환경 변수 관리 (VITE_ 접두어 필수):
rsbuild.config.ts 파일에서 loadEnv를 사용하여 VITE_ 접두어가 붙은 환경 변수를 자동 로드하도록 구성해야 한다.
<example>
import { defineConfig, loadEnv } from "@rsbuild/core"
import { pluginReact } from "@rsbuild/plugin-react"

const { publicVars } = loadEnv({ prefixes: ["VITE_"] })

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: "./public/index.html",
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
    define: publicVars,
  },
  // ... 나머지 설정
})
</example>

⚠️ 브라우저 코드에서의 접근 방식:
	•	VITE_ 접두어가 붙은 환경 변수만 빌드 시점에 클라이언트 코드로 노출된다.
	•	따라서 브라우저에서 동작하는 코드에서 환경 변수를 참고할 때는 반드시 다음과 같이 process.env.[ENVIRONMENT] 형태로 접근해야 한다.
<example>
const apiUrl = process.env.VITE_API_URL
console.log("Backend API:", apiUrl)
</example>

⸻

8. 데이터베이스 스키마
	•	Users: GitHub 프로필 데이터
	•	Projects: 프로젝트 메타데이터 및 보상 구조
	•	Issues: 보안 이슈, 상태, Severity, 변경 기록 (댓글로 기록됨)
	•	Comments: 이슈 논의 및 변경 기록 자동 코멘트

⸻

9. 운영 및 보안 정책
	•	데이터 보존: 프로젝트 및 이슈는 영구 보관
	•	권한 구조: 프로젝트 오너 / 일반 참여자(=동등 권한)
	•	Audit Log: 별도의 시스템 로그 불필요 (변경 기록은 댓글로 남김)
	•	법적 요구사항: 내부 프로젝트용이므로 보상 정산/세무 처리는 고려하지 않음