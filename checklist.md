# Previz Studio v1.3.5 — Recovery Checklist

## Phase 0 — Baseline Lock
- [x] 사용자 업로드 `previz-studio-v1.3.1(1).zip`을 직접 해제
- [x] 업로드본을 유일한 코드 baseline으로 지정
- [x] 원본 v1.3.1 `npm test` 32/32 PASS
- [x] 원본 v1.3.1 `npm run check` PASS

## Phase 1 — Docs First
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`

## Phase 2 — Recovery Version Identity
- [x] package version = 1.3.5
- [x] APP_VERSION = 1.3.5
- [x] SCENE_VERSION = 1.3.5
- [x] index / health / build labels = 1.3.5
- [x] tests의 version expectation만 1.3.5로 갱신

## Phase 3 — No-Feature Regression Guard
- [x] v1.3.2 Scene Tree selection sync 없음
- [x] World / Local 없음
- [x] Prompt collapse 없음
- [x] Undo / Redo 없음
- [x] Camera Safety 없음
- [x] fallback camera 없음
- [x] Camera keyframe 없음

## Phase 4 — Stable Features Preserved
- [x] 기본 30 FPS
- [x] 24 / 25 / 30 / 60 FPS
- [x] 20 sec @ 30 FPS = 600 frames
- [x] Canonical 16:9 Preview
- [x] Preview / PNG / Video 공통 frame path
- [x] Camera/Actor Transform
- [x] Manual Camera Override
- [x] Fight / Chase parser
- [x] Vite hashed assets

## Phase 5 — Local Verification
- [x] `npm test` PASS — 34/34
- [x] `npm run check` PASS
- [x] baseline과 기능 diff 확인 — runtime core `app.js / renderer-three.js / sequence.js / video-exporter.js` SHA-256가 업로드 v1.3.1과 동일
- [x] ZIP / SHA-256 생성

## Phase 6 — Production Acceptance
- [ ] 첫 접속 편집 뷰 정상
- [ ] 첫 카메라 프리뷰 정상
- [ ] 편집 ↔ 프리뷰 반복 전환 정상
- [ ] Camera Gizmo 수정 후 Preview 정상
- [ ] 20초 30 FPS Preview 정상
- [ ] 20초 30 FPS MP4 정상
- [ ] Preview ↔ MP4 구도 일치
