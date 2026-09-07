# Previz Studio v1.3.3 — Checklist

## Phase 0 — Docs
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`

## Phase 1 — Camera Safety Model
- [x] finite vec3 validation
- [x] scene bounds validation
- [x] minimum Camera ↔ Target distance
- [x] ground penetration validation
- [x] static geometry interior validation implementation
- [x] last-valid Camera snapshot per Shot

## Phase 2 — Safe Editing
- [x] Gizmo invalid move rollback
- [x] numeric input invalid move rollback
- [x] safe target editing
- [x] Camera recovery action
- [x] auto camera reset preserved
- [x] full Shot Camera path sampling validation

## Phase 3 — Diagnostics
- [x] Camera status UI
- [x] invalid reason message
- [x] out-of-frame subject warning
- [x] Viewport preview diagnostic
- [x] Shot-change Camera/Gizmo/Inspector re-sync
- [x] recovery status hold for user visibility

## Phase 4 — Regression
- [x] Camera/Actor selection and Gizmo static regression
- [x] Undo/Redo regression
- [x] Prompt Dock regression
- [x] default 30 FPS
- [x] 20 sec = 600 frames
- [x] 16:9 Canonical Preview
- [x] Preview / PNG / MP4 shared validated camera state
- [x] fight/chase parser regression

## Phase 5 — Verification
- [x] JavaScript syntax check
- [x] automated tests PASS
- [x] all 600 default frames Camera Safety basic PASS
- [x] invalid Camera unit tests PASS
- [x] local `/api/health` + static serving PASS
- [x] Vite build contract static test PASS
- [ ] local Vite production build — npm registry timeout
- [ ] Chromium interaction smoke — localhost access blocked by environment policy
- [ ] Production Vercel static-geometry Camera recovery check — 사용자 배포 후 확인

## Result
- Automated tests: **38/38 PASS**
- JavaScript syntax: **PASS**
- 20 sec @ 30 FPS = **600 Camera states PASS**
- Camera NaN / bounds / ground / minimum target distance tests: **PASS**
- Local health/static serving: **PASS**
- Three.js static geometry collision: implemented; Production interaction verification pending
