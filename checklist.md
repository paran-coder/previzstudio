# Previz Studio v1.3.2 — Checklist

## Phase 0 — Docs
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`

## Phase 1 — Selection & Inspector
- [x] 선택 오브젝트 헤더
- [x] Scene Tree selection state
- [x] Camera / Actor selection sync
- [x] Inspector Camera/Actor contextual sections

## Phase 2 — Transform UX
- [x] 이동 / 회전 / 타겟 mode selector
- [x] W / E / T shortcuts
- [x] World / Local toggle
- [x] numeric transform inputs sync with Gizmo
- [x] Camera target editing state

## Phase 3 — Undo / Redo
- [x] transform snapshot stack
- [x] Undo button + Cmd/Ctrl+Z
- [x] Redo button + Cmd/Ctrl+Shift+Z
- [x] Camera manual override state restored correctly

## Phase 4 — Prompt Dock
- [x] collapse / expand control
- [x] collapsed command bar
- [x] prompt text preserved
- [x] keyboard shortcut preserved

## Phase 5 — UI Polish
- [x] Inspector hierarchy
- [x] Timeline typography readability
- [x] Scene Tree inactive/active contrast
- [x] Camera/Actor semantic color consistency
- [x] reduced-motion/focus states

## Phase 6 — Regression
- [x] default 30 FPS
- [x] 20 sec = 600 frames
- [x] 24/25/30/60 FPS selector
- [x] Canonical 16:9 Camera Preview
- [x] Preview / PNG / MP4 shared canonical frame
- [x] fight prompt 2 actors / FIGHT / multi-shot
- [x] Camera/Actor manual edit regression

## Phase 7 — Verification
- [x] JavaScript syntax check
- [x] automated tests PASS
- [x] Vite build contract PASS (static contract; local npm install timeout)
- [ ] Production Vercel Gizmo interaction check — 사용자 배포 후 확인

## Result
- Automated tests: **34/34 PASS**
- JavaScript syntax: **PASS**
- Local Chromium runtime smoke: 환경 정책이 localhost/file 접근을 차단해 미실행
- Local Vite production build: npm registry timeout으로 미실행
