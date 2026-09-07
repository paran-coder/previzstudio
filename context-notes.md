# Previz Studio v1.3.3 — Context Notes

## Product Intent
Previz Studio는 Blender 프리비즈의 결과를 웹에서 더 단순한 작업 흐름으로 얻기 위한 3D 프리비즈 도구다. 자연어는 빠른 블로킹 입력이고, 제품의 중심은 실제 배우 동작, 카메라 연출, 수동 편집, Camera Preview와 Render의 일치다.

## v1.3.3 Goal
1. Camera Editing 중 검은 화면이 생기는 비정상 카메라 상태를 엔진 단계에서 차단한다.
2. Camera position / target / distance가 NaN, Infinity, 극단 좌표, 지면 아래, static set 내부로 들어가는 상황을 검증한다.
3. 위험한 카메라 편집은 마지막 정상 Camera 상태로 자동 복구한다.
4. Camera와 Target의 최소 거리를 보장한다.
5. Shot 전환 시 Gizmo / Inspector / Shot Camera 상태를 다시 동기화한다.
6. 피사체가 Camera Preview 바깥으로 완전히 벗어난 경우 경고하되, 의도적인 빈 프레임 가능성을 위해 자동 복귀하지는 않는다.
7. 검은 화면 대신 문제 원인과 `카메라 복구` / `자동 구도로 복귀` 액션을 제공한다.
8. 외부 AI는 붙이지 않는다. 자연어 해석 확장은 3D 엔진 안정화 이후 선택 기능으로 남긴다.

## Camera Safety Principles
- invalid numeric data는 Scene Document에 커밋하지 않는다.
- Camera height는 기본 지면보다 충분히 위에 있어야 한다.
- Camera와 Target은 최소 거리를 유지해야 한다.
- Camera가 static geometry의 내부 또는 너무 가까운 영역에 들어가면 invalid로 처리한다.
- 마지막 정상 Camera transform은 Shot + start/end key 단위로 보존한다.
- 안전 복구는 manual edit만 복구하며 Actor/Timeline 상태는 변경하지 않는다.
- 피사체가 frame 밖인 상태는 warning이며 hard invalid와 구분한다.
- Preview / PNG / MP4는 동일한 validated Camera state를 사용한다.

## UI Direction
- Inspector의 Camera Transform 영역에 `카메라 상태` diagnostic row를 추가한다.
- 정상 상태: `안전 · 프레임 유효`
- 경고 상태: `피사체가 프레임 밖입니다.`
- 복구 상태: `카메라가 벽/지면 내부로 이동해 이전 위치로 복구했습니다.`
- `카메라 복구` 버튼은 마지막 정상 수동 Camera transform을 복원한다.
- `자동 구도로 되돌리기`는 기존 자동 Camera 계산으로 돌아간다.
- Preview 진입 시 validation 결과를 Viewport status에도 짧게 노출한다.

## AI Direction
- v1.3.3에서는 외부 AI를 사용하지 않는다.
- AI가 맡을 수 있는 역할은 이후 자연어에서 Shot / Action / Camera intent를 더 유연하게 추출하는 것뿐이다.
- Camera collision, Transform validation, Preview, 렌더, Gizmo는 deterministic 3D engine 책임이다.

## v1.4.0 Next Step
Camera Keyframe Editing:
- Position
- Target
- Lens
- Start / Mid / End keyframes
- Timeline keyframe points
- interpolation

## Non-goals
- physics-based camera collision solver
- navmesh/pathfinding
- automatic shot quality scoring by external AI
- skeletal pose editing
- Curve/Graph Editor

## v1.3.3 Verification Target
- invalid numeric camera input rejected
- Camera ↔ Target minimum distance enforced
- ground penetration rejected/recovered
- static geometry interior rejected/recovered
- last valid Camera state can be restored
- out-of-frame subject warning works
- Shot change re-syncs Gizmo / Inspector / Camera state
- 30 FPS = 600 frames regression PASS
- Canonical Camera Preview = Render regression PASS

## v1.3.3 Verification Result
- JavaScript syntax: PASS
- Automated tests: 38/38 PASS
- 20 sec / 30 FPS / 600 Camera basic safety: PASS
- invalid numeric / bounds / ground / Camera-Target distance: PASS
- local health/static serving: PASS
- npm dependency install: registry timeout
- Chromium localhost interaction: environment policy blocked
- Three.js static geometry recovery: implementation complete, Production interaction verification pending
