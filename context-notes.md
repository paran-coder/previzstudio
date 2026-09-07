# Previz Studio v1.3.0 — Context Notes

## Product Intent
Previz Studio는 Blender 프리비즈의 결과를 웹에서 더 단순한 작업 흐름으로 얻기 위한 3D 프리비즈 도구다. 자연어는 엔진이 표현 가능한 장면 구조를 빠르게 블로킹하는 입력 수단이며 제품의 중심은 실제 배우 동작, 카메라 연출, 수동 편집, Preview/Render 일치다.

## v1.3.0 Goal
1. 자연어 파서가 `두 사람`, `격투/싸움`, `다양한 각도`, `역동적/익사이팅`을 최소한의 결정론적 규칙으로 이해한다.
2. `fight` 액션을 추가해 두 배우가 실제 격투 포즈를 반복하도록 한다.
3. Camera Editing을 추가한다: 위치, 높이, 거리, 타겟, 시작/끝 transform.
4. Three.js 편집 뷰에 Transform Gizmo를 추가한다.
5. Actor도 동일한 편집 체계에서 위치/회전을 수정할 수 있다.
6. 사용자 수정 카메라는 manual override로 저장해 자동 카메라 계산보다 우선한다.
7. v1.2.3 Canonical Frame 파이프라인은 유지한다. Preview / PNG / MP4/WebM은 같은 렌더 엔트리 포인트를 사용한다.

## Parser Philosophy
- LLM 연결은 필수가 아니다.
- 지원되는 단어만 추출하고 나머지는 무시한다.
- 배우 수, 환경, 시간대, 기본 액션, 카메라 강도/다양성, 렌즈, 길이를 결정론적으로 추출한다.
- 격투 장면은 2인 구도를 기본으로 한다.

## Fight Demo
> 두 사람이 격렬하게 하는 격투씬, 카메라가 다양한 각도로 익사이팅한 앵글로 따라간다.

예상 결과:
- Actor 01 / Actor 02
- FIGHT 액션
- 20초 / 4 shots
- Wide Orbit → Side Handheld → Opponent Follow → Between Push

## Camera Editing
- 카메라 선택 대상은 현재 Shot이다.
- Start / End 카메라 포인트를 각각 편집한다.
- Manual camera는 world-space start/end/target을 저장한다.
- Target mode: free / actor / midpoint.
- Camera 위치를 직접 수정하면 `manual.enabled = true`.
- `자동 구도로 되돌리기`로 manual override를 제거한다.

## Actor Editing
- 배우 선택 후 이동/회전 gizmo 사용.
- 이동은 배우의 모든 action `from/to`에 동일 delta를 적용한다.
- 회전은 actor rotation과 action rotation 값을 갱신한다.

## Non-goals
- 복잡한 격투 모션 캡처
- IK 리깅 편집
- Blender 수준 keyframe editor
- 중간 camera keyframe 다중 편집
- 자연어의 세밀한 의미 추론

## v1.3.0 Verification Status
- Exact user prompt: Actor 2 / FIGHT / 4-shot dynamic camera: PASS
- Syntax check: PASS
- Unit / contract tests: 29/29 PASS
- Existing chase canonical camera 480-frame regression: PASS
- Manual camera evaluator: PASS
- Actor path transform preservation: PASS
- Local Vite build: not executed because npm dependency cache is unavailable in this container
- Production Three.js TransformControls smoke test: pending after Vercel deployment
