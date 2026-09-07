# Previz Studio v1.3.1 — Context Notes

## Product Intent
Previz Studio는 Blender 프리비즈의 결과를 웹에서 더 단순한 작업 흐름으로 얻기 위한 3D 프리비즈 도구다. 자연어는 엔진이 표현 가능한 장면 구조를 빠르게 블로킹하는 입력 수단이며 제품의 중심은 실제 배우 동작, 카메라 연출, 수동 편집, Preview/Render 일치다.

## v1.3.1 Goal
1. 기본 시퀀스 프레임레이트를 24 FPS에서 30 FPS로 변경한다.
2. 사용자가 프로젝트 FPS를 24 / 25 / 30 / 60 중에서 선택할 수 있게 한다.
3. Shot의 시작/끝 시간은 초 단위로 유지하고 FPS 변경 시 내부 frame count만 재계산한다.
4. Preview / Actor Animation / Camera Evaluation / PNG / MP4/WebM이 모두 동일한 `sequence.fps`를 사용한다.
5. 공식 20초 테스트는 30 FPS 기준 600프레임으로 검증한다.
6. v1.3.0 Camera/Actor Transform, Manual Override, Canonical Frame 구조는 회귀 없이 유지한다.

## Frame-rate Philosophy
- 프리비즈의 연출 타이밍은 초 단위가 canonical이다.
- FPS는 샘플링 빈도이므로 20초 Shot 구조 자체를 바꾸지 않는다.
- 20초 기준 frame count:
  - 24 FPS → 480 frames
  - 25 FPS → 500 frames
  - 30 FPS → 600 frames
  - 60 FPS → 1200 frames
- 기본값은 웹 재생/화면 녹화/AI 영상 레퍼런스 워크플로와 맞추기 위해 30 FPS로 둔다.

## UI Direction
- 오른쪽 `영상 출력`에 FPS 선택기를 둔다.
- 선택 가능한 값은 24 / 25 / 30 / 60 FPS로 제한한다.
- Timeline 헤더, render settings, frame total 표시가 선택 즉시 갱신된다.
- FPS 변경은 현재 Scene Document의 `sequence.fps`를 갱신한다.

## Canonical Output Contract
- `renderCanonicalFrame(time)`는 초 단위 time을 입력으로 받는다.
- Video exporter는 `frameIndex / fps`로 각 프레임의 canonical time을 계산한다.
- PNG reference의 end frame은 `shot.end - 1/fps`를 사용한다.
- Camera Preview와 Video Export는 동일한 Scene Document FPS를 사용한다.

## v1.3.0 Features Preserved
- two-actor fight parser / FIGHT action
- Camera position / height / distance / target editing
- Camera and Actor Transform Gizmo
- manual camera override
- Canonical 16:9 output frame
- Vite hashed production assets

## Non-goals
- variable frame rate export
- fractional cinema rates such as 23.976 / 29.97 in this patch
- per-shot mixed FPS
- optical-flow frame interpolation

## v1.3.1 Verification Target
- exact default FPS = 30
- FPS choices = 24 / 25 / 30 / 60
- 20 sec @ 30 FPS = 600 valid evaluated frames
- 20 sec @ 24/25/60 FPS produce 480/500/1200 frame counts
- shot boundaries stay at the same seconds after FPS change
- Camera/Actor manual edits still evaluate correctly at every supported FPS

## v1.3.1 Verification Result
- JavaScript syntax check: PASS
- Automated tests: 32/32 PASS
- 20 sec @ 30 FPS: 600 camera-evaluated frames PASS
- 24/25/30/60 FPS frame-count contract: PASS
- v1.3.0 Transform/manual camera/canonical frame regression: PASS
- Production Vercel 30 FPS video metadata/visual check: pending after user deployment
