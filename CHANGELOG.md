# v1.6.0 — 2026-10-04

기존 3D 마네킹을 유지하고 장면 입력창과 촬영 프리뷰를 상시 표시합니다. 선택 대상별 설정, 작업 시점 복사, 샷 전체 카메라 이동, 출발/도착 핸들, 소품/공간 설정, 단일 드래그 되돌리기를 추가했습니다. 타임라인 선택과 설명 보존, 출력 중 편집 잠금도 보완했습니다.

# Previz Studio-v1.5.0 — 2026-10-04

- 구조화 선택 입력을 기본으로 변경.
- 가게/건물 앞, 구별되는 배우와 우산 소품 추가.
- 접근/걷기/달리기 동선과 구간 타이밍 편집.
- 분위기 보조 프롬프트 TXT 및 소품 포함 명세.
- 제자리 구간 순간 이동 방지와 도착 회전 연결.
- 사용자 결정에 따라 AI 연결은 후속으로 보류.

# Previz Studio-v1.4.0 — 2026-10-04

- 프롬프트의 인원, 마주보기, 나이프 액션 및 소품 구성 지원.
- 명시적 카메라 지시 우선 및 고정 카메라 타깃 유지.
- 해석 결과, 기본 가정, 미지원/Canvas 제한 표시.
- 1.3.5 씬 문서 호환, 기존 영상 출력 보존.
- 테스트 41개, 브라우저 점검 16개 통과. 실배포는 업로드 후 확인.

# Changelog

## v1.3.5 — Recovery Baseline

### Recovery
- 사용자 업로드 `previz-studio-v1.3.1(1).zip`을 직접 기준으로 완전 롤백
- v1.3.2~v1.3.4의 상태 관리 / Camera Safety 변경을 기준 코드에서 제거
- v1.3.1의 Production 검증된 Camera Preview / Render / 30 FPS 흐름을 그대로 보존
- 기능 코드는 변경하지 않고 버전/문서/build identity만 v1.3.5로 갱신

### Development Policy
- Recovery Baseline Production 통과 전 신규 기능 추가 금지
- 이후 핵심 기능은 한 버전에 하나씩만 재도입
- 매 단계마다 Preview/Render Production 회귀 검증


## v1.3.1

### Frame Rate
- 기본 프로젝트 FPS를 24에서 **30 FPS**로 변경
- 24 / 25 / 30 / 60 FPS 선택 기능 추가
- 20초 기본 시퀀스는 30 FPS에서 600프레임
- FPS 변경 시 Shot 시간은 초 단위로 유지하고 frame count만 재계산
- 장면을 다시 생성해도 사용자가 선택한 프로젝트 FPS 유지

### Output
- Timeline step이 선택 FPS의 `1/fps`로 변경
- Preview / Camera / Actor / PNG / MP4/WebM이 동일한 Scene Document FPS 공유
- PNG end reference가 선택 FPS 기준 마지막 유효 프레임 사용
- MediaRecorder `captureStream()`과 MP4 encoder frameRate가 선택 FPS 사용

### Regression
- v1.3.0 Camera/Actor Transform Gizmo 유지
- Manual Camera Override 유지
- Canonical 16:9 Preview/Render 파이프라인 유지
- fight prompt / chase sequence 회귀 없음

### Verification
- JavaScript syntax check: PASS
- Automated tests: **32/32 PASS**
- 20 sec @ 30 FPS: **600 evaluated frames PASS**
- FPS frame-count contract 24/25/30/60: PASS


