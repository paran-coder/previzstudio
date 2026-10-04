# Previz Studio-v1.4.0 Context Notes

2026-10-04: 사용자 승인에 따라 실제 Vite 앱의 프롬프트 구성 기능을 수정했습니다.

- 기준: GitHub v1.3.5, commit 51c615350111ebcfcd1efe45265aa32acf232697.
- 원인: 이전 v1.0.1 날짜형 파일은 Vite 배포 진입점이 아니었으며 실제 파서가 두사람/나이프액션 표현을 누락했습니다.
- 실제 실행 경로: index.html → src/app.js → director/sequence/renderer, Vite dist 출력.
- 수정: 인원·마주보기·나이프 액션/소품·명시 카메라 우선·해석 및 제한 안내.
- 렌더러/영상 출력 기반 유지. video-exporter.js는 기존 내용 그대로입니다.
- 외부 AI 연결 없음. 규칙 기반 지원 구문과 기본 블로킹 범위를 사용자에게 표시합니다.
- 검증: 모델/구성 테스트 41개, 브라우저 16개, 구문 검사/빌드, MP4 디코딩 통과.
- 배포 확인은 사용자의 GitHub 업로드 후 필요합니다. 에이전트는 push/deploy를 수행하지 않았습니다.
- 레거시 server.mjs의 health 버전 1.3.5는 보존했습니다. Vite 앱 버전은 1.4.0입니다.
