# Previz Studio v1.3.4 — Recovery Checklist

## Phase 0 — Documentation
- [x] context-notes.md
- [x] checklist.md
- [x] README.md
- [x] User manual.md

## Phase 1 — Restore stable baseline
- [ ] Rebase runtime on v1.3.4
- [x] Preserve 30 FPS / 600-frame default
- [x] Preserve canonical 16:9 Preview/PNG/MP4 path
- [x] Preserve chase/fight deterministic parser
- [x] Preserve Camera/Actor manual edit support

## Phase 2 — Remove regressions
- [x] Remove global Scene clone Undo/Redo
- [x] Remove per-frame Camera Safety/fallback logic
- [x] Remove geometry obstacle scan from applyTime/render hot path
- [x] Remove automatic fallback camera substitution

## Phase 3 — Reapply low-risk UX only
- [x] Scene Tree selects Camera/Actor
- [x] Inspector clearly shows selected object
- [x] Viewport HUD shows selected object/mode
- [x] World/Local transform space
- [x] Collapsible prompt dock

## Phase 4 — Regression verification
- [x] JavaScript syntax check
- [x] Unit/contract tests
- [x] 20 s × 30 FPS = 600 frame evaluation
- [x] Canonical preview/export contract
- [x] Repeated Edit ↔ Preview state-transition contract test (state mutation/fallback 없음)
- [x] Manual Camera transform remains valid
- [x] Manual Actor transform remains valid
- [x] No v1.3.2 Undo/Redo code remains
- [x] No v1.3.3 Camera Safety hot-path code remains

## Production acceptance
- [ ] Edit View ↔ Camera Preview repeated switching shows no black screen
- [ ] Gizmo edit → Camera Preview remains visible
- [ ] 20-second 30 FPS MP4 renders normally
- [ ] Preview framing matches MP4
