# Changelog

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
