# Previz Studio v1.3.0 — Checklist

## Phase 0 — Docs
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`

## Phase 1 — Prompt Parser
- [x] `두 사람` actor count 추출
- [x] `격투/격투씬/싸움` fight scene template
- [x] `다양한 각도/여러 앵글/익사이팅/역동적` multi-shot direction
- [x] 일반 장면에서도 varied-angle 표현은 4-shot으로 확장
- [x] 사용자 제공 격투 프롬프트 regression test

## Phase 2 — Fight Action
- [x] `fight` Scene Schema action
- [x] procedural strike / guard pose state
- [x] two actor facing/blocking
- [x] timeline `격투 · FIGHT` clip
- [x] Three.js / Canvas pose path

## Phase 3 — Camera Editing
- [x] camera manual override schema
- [x] position X/Y/Z
- [x] height
- [x] distance
- [x] free / actor / midpoint target mode
- [x] target XYZ / target offset
- [x] start/end camera key selection
- [x] `자동 구도로 되돌리기`
- [x] manual camera included in Scene JSON / Reference Manifest

## Phase 4 — Transform Gizmo
- [x] Three.js `TransformControls`
- [x] Camera translate
- [x] Camera rotate
- [x] Camera target gizmo
- [x] Camera → Target guide
- [x] Actor translate
- [x] Actor rotate
- [x] W / E / T shortcuts
- [x] numeric input fallback
- [x] Actor/Camera path guide refresh after edits

## Phase 5 — Canonical Output Regression
- [x] manual camera is consumed by `evaluateCameraAtTime()`
- [x] Camera Preview keeps `renderCanonicalFrame()`
- [x] PNG keeps `renderCanonicalFrame()`
- [x] MP4/WebM path keeps `renderCanonicalFrame()`
- [x] Preview output aspect remains canonical 16:9
- [x] Gizmo helpers are hidden in preview/export mode

## Phase 6 — Verification
- [x] JavaScript syntax check
- [x] unit / contract tests: **29/29 PASS**
- [x] exact user fight prompt -> Actor 2 / FIGHT / 4 shots
- [x] 480-frame chase camera regression
- [x] manual camera evaluator test
- [x] actor transform path-preservation test
- [x] Vite hashed asset contract test
- [ ] local `npm install && npm run build` — npm cache에 dependencies가 없어 현재 환경에서 실행 불가
- [ ] Production Three.js Transform Gizmo interaction smoke test — Vercel 배포 후 확인
- [ ] Production fight Preview / MP4 visual check — Vercel 배포 후 확인
