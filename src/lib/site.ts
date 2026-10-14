// 정식 도메인. canonical, sitemap, robots, RSS, JSON-LD가 모두 이 값을 사용한다.
// 환경변수 누락으로 다른 도메인이 canonical에 들어가는 일을 막기 위해 코드에 고정한다.
export const SITE_URL = 'https://www.cheetahrockets.com'
export const SITE_HOSTNAME = new URL(SITE_URL).hostname
