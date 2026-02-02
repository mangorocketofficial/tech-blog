# 테크매니아 - 설정 가이드

## 1. Supabase 설정

### 1.1 프로젝트 생성
1. [Supabase](https://supabase.com)에 접속하여 새 프로젝트를 생성합니다
2. 프로젝트 이름: `tech_blog`
3. 데이터베이스 비밀번호 설정 후 프로젝트 생성

### 1.2 데이터베이스 스키마 설정
1. Supabase Dashboard → SQL Editor로 이동
2. `supabase/schema.sql` 파일 내용을 복사하여 실행
3. `supabase/migrations/add_settings_table.sql` 파일 내용을 복사하여 실행

### 1.3 Storage 버킷 생성
1. Supabase Dashboard → Storage로 이동
2. "New bucket" 클릭
3. 버킷 이름: `post-images`
4. Public bucket으로 설정

### 1.4 Storage 정책 설정
SQL Editor에서 다음을 실행:

```sql
-- 누구나 이미지 읽기 가능
CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Service role만 업로드 가능
CREATE POLICY "Service role can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images');
```

## 2. 환경 변수 설정

`.env.example`을 `.env.local`로 복사하고 값을 채웁니다:

```bash
cp .env.example .env.local
```

### 필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public 키
- `SUPABASE_SERVICE_KEY`: Supabase service role 키
- `OPENAI_API_KEY`: OpenAI API 키 (AI 글 생성용)
- `ADMIN_PASSWORD`: 어드민 페이지 접근 비밀번호

Supabase 키는 Dashboard → Settings → API에서 확인할 수 있습니다.

## 3. 프로젝트 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 4. Vercel 배포 (선택사항)

```bash
# Vercel CLI 설치 (처음인 경우)
npm i -g vercel

# 배포
vercel
```

배포 후 Vercel Dashboard에서 환경 변수를 설정합니다.

## 5. 사용 방법

1. `http://localhost:3000/admin`으로 접속
2. 비밀번호 입력 (ADMIN_PASSWORD)
3. 글 작성 또는 AI 자동 생성

---

생성 정보:
- 블로그 이름: 테크매니아
- 주제: 테크
- 카테고리: 인공지능과 머신러닝, 모바일 기술, 인터넷 보안, 클라우드 컴퓨팅, 하드웨어 리뷰, 소프트웨어 개발, 가상현실과 증강현실, 스타트업과 혁신, 기타
