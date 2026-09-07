# Previz Studio v1.2.2 — Checklist

## Phase 0 — Required docs
- [x] `context-notes.md` updated before implementation
- [x] `checklist.md` updated before implementation
- [x] `README.md` updated before implementation
- [x] `User manual.md` updated before implementation

## Phase 1 — Output framing consistency
- [x] Canonical output aspect derived from sequence dimensions
- [x] Camera Preview rendered inside fixed output-aspect stage
- [x] Shot Camera aspect never follows arbitrary UI viewport ratio
- [x] Edit camera keeps independent responsive aspect
- [x] PNG capture uses canonical output framing
- [x] MP4/WebM export uses canonical output framing
- [x] Export restore returns to correct preview/edit size
- [x] Preview/export regression tests added

## Phase 2 — Initial Edit View camera
- [x] Scene bounds / travel direction overview calculation
- [x] 3/4 elevated initial angle
- [x] Blocking + early travel path visible
- [x] Avoid dominant foreground road/building obstruction
- [x] User orbit/zoom marks camera as manually adjusted
- [x] Scene regeneration intentionally reframes once
- [x] Canvas fallback matches overview intent

## Phase 3 — Production UI hierarchy
- [x] Stronger dark surface separation
- [x] Side panels visually distinct from workspace
- [x] Timeline elevated as second-priority module
- [x] Typography target increased for Korean UI
- [x] Inspector current-shot hierarchy strengthened
- [x] CTA state hierarchy preserved
- [x] Camera Preview stage/letterbox visually clear

## Phase 4 — Verification
- [x] Syntax checks pass
- [x] Unit/contract tests pass
- [x] 20s shot timing regression passes
- [x] Shot camera aspect regression passes
- [x] Initial Edit View framing regression passes
- [x] Representative preview/export frame contract passes
- [ ] Static 1920x1080 UI review generated (container Chromium capture unavailable)
- [ ] Production rerender verification after user deploy

## Result
Core v1.2.2 implementation complete. Production frame-by-frame verification remains after user deployment.
