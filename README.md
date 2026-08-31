# 지식 아카이브

유튜브, 기사, 레포트, 글 등 흩어진 지식을 한 곳에 모으고, AI로 요약-구조화해서
언제든 꺼내 쓸 수 있게 정리하는 개인 지식 아카이빙 앱입니다.
Notion(깔끔한 페이지 UI)과 Readwise(하이라이트/카드 스타일)를 참고해 디자인했습니다.

## 구조

- `client/` - React(Vite) 오프라인 웹 앱. 데이터는 기기 로컬(localStorage)에만 저장되며 서버가 필요 없습니다.
- `client/android/` - Capacitor로 생성한 Android 프로젝트 (APK 빌드용)
- `.github/workflows/build-apk.yml` - GitHub Actions에서 자동으로 APK를 빌드하는 워크플로우

## AI 재가공 방식

별도의 Anthropic API 과금 없이, 이미 구독 중인 Claude.ai 요금제를 그대로 활용합니다.

1. 지식 카드에서 "AI 프롬프트 생성"을 누르면 요약용 프롬프트가 만들어집니다.
2. 프롬프트를 복사해 Claude.ai에 붙여넣습니다.
3. Claude의 답변을 앱에 다시 붙여넣고 저장하면, 한 줄 요약-핵심 내용-인사이트-추천 태그가
   구조화되어 저장되고 태그가 자동으로 반영됩니다.

## 웹에서 실행

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

빌드된 정적 파일(`npm run build` 결과인 `client/dist/`)은 PWA로 동작합니다.
모바일 브라우저에서 열고 "홈 화면에 추가"를 하면 앱처럼 설치해 오프라인으로 쓸 수 있습니다.

## APK 빌드

이 리포지토리를 push하면 GitHub Actions(`build-apk.yml`)가 자동으로 실행되어
Android 디버그 APK를 빌드하고 워크플로우 아티팩트로 업로드합니다.
Actions 탭 → 해당 워크플로우 실행 → Artifacts에서 `knowledge-archive-debug-apk`를 내려받으면 됩니다.

로컬에 Android SDK(Android Studio)가 있다면 직접 빌드할 수도 있습니다.

```bash
cd client
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# 결과물: client/android/app/build/outputs/apk/debug/app-debug.apk
```

## 버전

`client/package.json` 의 `version` 이 기준이고, 빌드할 때 안드로이드 `versionName` 과
앱 화면(테마 시트 하단)에 자동으로 반영됩니다.

- 작은 변경(문구, 버그 수정, 다듬기): +0.01
- 큰 변경(화면 구조, 기능 추가): +0.1

| 버전 | 내용 |
|---|---|
| 0.1 | 오프라인 아카이빙 앱 첫 동작, APK 빌드 파이프라인 |
| 0.2 | 모바일 UI 재설계 (상단 앱바 + 하단 탭바, safe-area 대응) |
| 0.3 | 테마 4종(편집형/인덱스형/몰입형/토스풍), Pretendard 적용 |
| 0.31 | 구분 기호를 하이픈으로 통일 |
| 0.32 | 버전 표기 체계 도입 |

## 주요 기능

- 지식 등록: 텍스트 또는 URL(유튜브/기사/레포트 링크) + 메모 + 태그
- 사이드바 아카이브: 저장 개수, 태그별 필터, 제목/본문/요약 검색
- AI 재가공: 프롬프트 생성 → Claude.ai 응답 붙여넣기 → 구조화된 요약 저장
- 태그 편집, 카드 삭제
- 오프라인 우선 (localStorage) + PWA 설치 지원
