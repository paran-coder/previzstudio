# Previz Studio v1.3.1 — Checklist

## Phase 0 — Docs
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`

## Phase 1 — Frame-rate Model
- [x] default `sequence.fps` = 30
- [x] supported FPS = 24 / 25 / 30 / 60
- [x] FPS change preserves sequence duration in seconds
- [x] FPS change preserves Shot start/end seconds
- [x] total frame count recalculates from `duration * fps`

## Phase 2 — UI
- [x] 영상 출력 FPS selector
- [x] timeline header FPS live update
- [x] output settings FPS live update
- [x] total frame count visible
- [x] unsupported FPS values rejected

## Phase 3 — Canonical Output
- [x] Camera Preview timeline step uses selected FPS
- [x] Export Actor animation sampling uses selected FPS
- [x] Camera edit/end-frame epsilon uses selected FPS
- [x] PNG end-frame timing uses selected FPS
- [x] MP4/WebM exporter uses selected FPS
- [x] MediaRecorder captureStream uses selected FPS

## Phase 4 — Regression
- [x] Camera/Actor Transform Gizmo regression
- [x] manual camera override regression
- [x] fight prompt regression
- [x] canonical 16:9 preview regression
- [x] Vite hashed asset contract regression

## Phase 5 — Verification
- [x] JavaScript syntax check
- [x] automated tests PASS
- [x] 20 sec @ 30 FPS = 600 valid frames
- [x] 20 sec @ 24 FPS = 480 frames
- [x] 20 sec @ 25 FPS = 500 frames
- [x] 20 sec @ 60 FPS = 1200 frames
- [ ] local `npm install && npm run build` — 현재 환경의 npm registry 접근 timeout
- [ ] Production Vercel 30 FPS Preview/Render + video metadata check — 배포 후 확인
