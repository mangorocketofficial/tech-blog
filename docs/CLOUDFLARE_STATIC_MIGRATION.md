# Cloudflare 정적 사이트 마이그레이션 운영 문서

이 문서는 `tech-blog`, `pet_blog`, `golf_blog` 세 사이트에 공통으로 적용한 구조와 도메인당 1만 글 운영 기준을 설명한다.

## 운영 구조

```text
일반 방문자
  -> Cloudflare Workers Static Assets의 정적 HTML/CSS/JS
  -> 글 조회 시 Supabase 및 서버 함수 호출 없음

관리자 /admin
  -> Supabase Edge Function(admin-api)
  -> Supabase Postgres·Storage / OpenAI
  -> 글을 여러 개 작성해도 즉시 사이트 재빌드하지 않음

배포 작업
  -> Supabase REST에서 공개 글 전체를 1,000개 단위로 한 번씩 읽음
  -> .content-cache/content.json 스냅샷 생성
  -> Next.js가 모든 페이지를 정적 HTML로 출력
  -> 브라우저 검색용 public/search-index.json 생성
  -> RSC .txt 파일 제거
  -> Cloudflare Workers Static Assets에 out/ 한 번 배포
```

사이트 설정:

| 저장소 | 정식 도메인 | Supabase ref | Edge profile | Cloudflare Worker |
| --- | --- | --- | --- | --- |
| `tech-blog` | `www.cheetahrockets.com` | `miubturwmhzctjeyiakp` | `tech` | `tech-blog` |
| `pet_blog` | `www.petbusan.com` | `ibpfwwrqdbpqekoptior` | `pet` | `pet-blog` |
| `golf_blog` | `www.kanomsoft.com` | `aumzrheyehxilegpffol` | `golf` | `golf-blog` |

## 글 작성과 배포

1. `/admin`에서 글을 작성·수정·삭제한다. 작업은 Edge Function과 Supabase에서 끝나며 공개 정적 사이트는 아직 바뀌지 않는다.
2. 필요한 글을 모두 작성한 뒤 `작성한 글 배포`를 한 번 실행한다.
3. 배포 작업이 전체 공개 글 스냅샷을 새로 만들고 정적 사이트를 교체한다.
4. 실패한 업로드는 기존 Cloudflare 배포에 영향을 주지 않는다. 필요하면 이전 Worker 버전으로 롤백한다.

GitHub Actions에는 수동 실행과 1일 1회 예약 실행이 있다. Edge Function의 배포 버튼을 쓰려면 최소 `Actions: write` 권한의 `GITHUB_DEPLOY_TOKEN`을 Edge secret으로 추가해야 한다.

## 로컬 명령

```bash
npm run content:sync
npm run build
npm run lint
npm run deploy:cloudflare
```

필수 빌드 환경변수는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`이다. 관리자 API 주소는 `NEXT_PUBLIC_ADMIN_API_URL`을 사용하며 생략하면 Supabase URL에서 자동 계산한다.

## Edge Function secrets

공통 필수 항목:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `OPENAI_API_KEY`, `SITE_PROFILE`
- `ALLOWED_ORIGINS`
- 배포 버튼 사용 시 `DEPLOY_HOOK_URL`, 또는 `GITHUB_REPOSITORY`, `GITHUB_DEPLOY_TOKEN`, `DEPLOY_BRANCH`

`SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 자동으로 제공한다. 서비스 역할 키는 브라우저나 GitHub의 공개 빌드 환경에 넣지 않는다.

## 도메인과 검색 분석 유지

- canonical, sitemap, robots, RSS, JSON-LD는 각 저장소의 `src/lib/site.ts`에 고정된 기존 `www` URL을 사용한다.
- 루트 도메인은 Cloudflare Redirect Rule에서 `https://www.<domain>/${1}`로 301 이동한다.
- GA4 측정 ID와 Google Search Console 검증 메타 태그는 기존 값을 그대로 빌드한다.
- DNS 전환 전에 `workers.dev` 주소에서 canonical, GA4 ID, sitemap, 주요 글 URL을 확인한다.
- 전환 후 같은 URL에 200, 루트 도메인에 301, 기존 글 URL에 200이 나오는지 다시 확인한다.

## 도메인당 1만 글 기준

현재 정적 출력은 글 하나당 핵심 HTML 파일 하나를 만들며 Next.js RSC `.txt` 파일은 배포 전에 제거한다. 실제 표본은 다음과 같다.

| 사이트 | 글 수 | 배포 파일 수 | 출력 크기 |
| --- | ---: | ---: | ---: |
| tech | 249 | 342 | 약 20MB |
| pet | 387 | 497 | 약 35MB |
| golf | 298 | 390 | 약 24MB |

이 비율이면 1만 글은 사이트당 대략 1만~1.1만 파일, 약 0.5~1GB이다. Cloudflare Workers 무료 플랜의 Static Assets 버전당 2만 파일 범위 안이다. 정적 파일 요청은 무료이며 Worker 스크립트를 실행하지 않는다.

권장 운영 기준:

- 글 생성은 요청마다 1개씩 저장하되 배포는 20~100개 단위 또는 하루 1회로 묶는다.
- `posts.slug` 고유 인덱스와 공개 글용 category/published_at 부분 인덱스를 유지한다.
- 빌드는 Supabase를 페이지마다 호출하지 않고 한 번의 페이지네이션 스냅샷만 사용한다.
- 사이트맵 1개는 5만 URL까지 가능하므로 1만 글에서는 분할할 필요가 없다.
- 검색 인덱스는 검색 페이지를 열 때만 다운로드한다. 압축 후 크기가 커지면 카테고리별 JSON으로 분할한다.
- 배포 파일 수가 18,000개를 넘거나 빌드가 45분을 넘으면 경고한다. 그 시점에는 Cloudflare 유료 100,000파일 한도 또는 R2 HTML 저장소+Worker 라우터로 전환한다.
- 모든 빌드의 마지막 단계에서 `verify-static-output.mjs`가 RSC 파일 잔존 여부, 글·파일 수, 전체 용량, 검색 인덱스 크기와 빌드 시간을 검사한다. 무료 플랜의 20,000파일 한도를 넘는 배포는 업로드 전에 실패시킨다.
- Supabase Edge Function에서 대량 AI 생성을 한 요청에 몰지 않는다. 글 생성 작업을 작은 작업 단위로 나눠 시간 제한과 재시도를 관리한다.

## 롤백

DNS 전환 전에는 Vercel을 유지한다. Cloudflare production 확인 후 DNS만 바꾸며, 문제가 생기면 DNS 레코드를 기존 Vercel 대상으로 되돌릴 수 있다. Cloudflare에서도 이전 성공 Worker 버전으로 즉시 롤백할 수 있다.
