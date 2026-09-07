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
