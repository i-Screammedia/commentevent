# 댓글 이벤트 운영 가이드

## 1) 환경변수 설정
`.env.local` 파일을 만들고 아래 값을 채웁니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAILS=admin1@your.org,admin2@your.org
```

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하면 안 됩니다.
- `ADMIN_EMAILS`에 포함된 계정만 `/admin`과 CSV 다운로드를 사용할 수 있습니다.

## 2) DB 테이블 생성
Supabase SQL Editor에서 `supabase-schema.sql`을 실행합니다.

정적 사이트(index.html)에서 **모든 사용자 공용 댓글**을 쓰려면,
Supabase SQL Editor에서 `supabase-public-comments.sql`도 실행합니다.

## 3) 관리자 계정 준비
Supabase Auth에서 관리자 계정(email/password)을 생성합니다.
생성한 이메일을 `ADMIN_EMAILS`에 추가합니다.

## 4) 동작
- 사용자 페이지: `/`
  - 학교명/지역/연락처/닉네임/댓글 입력 후 등록
  - 금칙어/중복 정책 적용
- 관리자 페이지: `/admin`
  - 로그인 필요
  - 목록 조회/검색
  - CSV 다운로드 (`/api/admin/export`)

## 5) 보안 포인트
- CSV는 서버 API에서만 생성하며 관리자 권한을 검사합니다.
- 사용자에게는 DB 직접 조회 권한을 열어두지 않습니다.
