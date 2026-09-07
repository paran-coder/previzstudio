# Previz Studio v1.3.2 — Context Notes

## Product Intent
Previz Studio는 Blender 프리비즈의 결과를 웹에서 더 단순한 작업 흐름으로 얻기 위한 3D 프리비즈 도구다. 자연어는 빠른 블로킹 입력이고, 제품의 중심은 실제 배우 동작, 카메라 연출, 수동 편집, Camera Preview와 Render의 일치다.

## v1.3.2 Goal
1. Camera/Actor Editing을 실제 편집 툴 수준의 작업 흐름으로 정리한다.
2. Inspector를 `선택 오브젝트 → Transform → Camera/Actor 속성` 위계로 재편한다.
3. 선택 상태를 Scene Tree / Viewport / Inspector에서 일관되게 보여준다.
4. Transform Gizmo를 이동 / 회전 / 타겟으로 명확히 분리한다.
5. Transform 공간을 World / Local로 전환할 수 있게 한다.
6. Camera/Actor 편집을 위한 기본 Undo / Redo 스택을 제공한다.
7. Prompt Dock을 접기/펼치기로 바꾸어 Viewport와 Timeline 공간을 확보한다.
8. Camera Editing 중심으로 Typography / Panel / Timeline / Inspector hierarchy를 마지막으로 정리한다.
9. v1.3.1의 30 FPS, 16:9 Canonical Preview, Preview/Render 일치, Manual Override를 회귀 없이 유지한다.

## Editing UX Principles
- 현재 선택된 오브젝트와 편집 모드를 항상 한눈에 알 수 있어야 한다.
- Drag 조작과 숫자 입력은 같은 값을 편집해야 한다.
- Camera는 위치/회전/타겟, Actor는 위치/회전을 편집한다.
- World / Local 전환은 Gizmo와 Inspector에 동일하게 반영한다.
- Undo는 Transform 단위로 동작하고 자동 카메라 복귀도 Undo 가능한 편집 상태로 취급한다.
- Prompt는 중요한 입력이지만 상시 화면의 주인공은 아니다. 필요할 때 열고 닫을 수 있어야 한다.

## UI Direction
- 선택 오브젝트 헤더를 Inspector 최상단에 둔다.
- Transform mode selector를 compact segmented control로 만든다.
- World / Local은 Transform mode와 같은 영역에 둔다.
- Camera 값은 Position / Height / Distance / Target / Lens 순으로 그룹화한다.
- Actor 값은 Position / Rotation / Action 상태 순으로 그룹화한다.
- Scene Tree의 선택 행은 명확한 active surface와 semantic accent를 사용한다.
- Timeline은 Viewport 다음으로 강한 모듈이며 clip label은 최소 11px 이상으로 유지한다.
- Prompt Dock은 collapsed 상태에서 한 줄 command bar만 남긴다.

## v1.4.0 Next Step
Camera Keyframe Editing을 추가한다.
- Position
- Target
- Lens
- Start / Mid / End keyframes
- Timeline keyframe points
- interpolation

## Non-goals
- Curve Editor / Graph Editor
- multi-select transform
- skeletal pose editing
- arbitrary per-frame keyframing
- full Blender shortcut compatibility

## v1.3.2 Verification Target
- Camera/Actor selection state consistent across Scene Tree / Viewport / Inspector
- W/E/T tool modes work and update the same transform model
- World / Local toggles TransformControls space
- Undo / Redo restore Camera/Actor transform edits
- Prompt Dock collapse/expand works without losing input
- 30 FPS = 600 frames regression PASS
- Camera Preview = Render canonical frame regression PASS

## v1.3.2 Verification Result
- JavaScript syntax: PASS
- Automated tests: 34/34 PASS
- 30 FPS / 600 frame regression: PASS
- Canonical frame regression: PASS
- Selection / World-Local / Undo-Redo / Prompt collapse static contract: PASS
- Browser interaction smoke: environment blocked localhost/file URL access
- Local Vite build: npm registry timeout
- Production Vercel interaction verification: pending user deployment
