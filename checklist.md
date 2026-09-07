# Previz Studio v1.2.1 — Checklist

## Phase 0 — Required docs
- [x] `context-notes.md` updated before implementation
- [x] `checklist.md` updated before implementation
- [x] `README.md` updated before implementation
- [x] `User manual.md` updated before implementation

## Phase 1 — Camera consistency
- [x] Shared camera evaluator for preview/export
- [x] Camera Preview auto-cuts on master shot boundaries
- [x] Export uses the exact same `applyTime()` evaluator path
- [x] Removed arbitrary shot-01 camera world coordinates
- [x] Shot cameras composed from actor blocking + travel direction
- [x] Short shot/lens/camera overlay on cuts
- [x] Regression tests for cut boundaries/camera transform
- [x] Full 480-frame finite camera transform check

## Phase 2 — UI hierarchy / surfaces
- [x] Layered dark surfaces (background/workspace/panel/elevated/interactive)
- [x] Reduced shadow reliance and strengthened 1px surface borders
- [x] Rebuilt typography hierarchy
- [x] Removed Korean micro-label over-tracking
- [x] Increased timeline clip/track readability
- [x] Made current shot the primary inspector information
- [x] De-emphasized renderer technical status
- [x] Separated primary/secondary CTA hierarchy by view state
- [x] Improved active/focus states without decorative noise
- [x] Camera guide color aligned to camera-purple semantic

## Phase 3 — View semantics
- [x] Renamed output view to `카메라 프리뷰`
- [x] Edit view visibly identified as workspace/non-output view
- [x] Camera Preview and export share master-time camera evaluation
- [x] Render CTA becomes primary only in Camera Preview

## Phase 4 — Verification
- [x] Syntax checks pass
- [x] Unit/contract tests pass — 14/14
- [x] 20s / 24fps shot cut timing regression passes
- [x] Preview/export evaluator contract passes
- [x] Static 1710×910 UI hierarchy review generated
- [ ] Actual Chromium/Three.js visual smoke test in this container (graphics init unavailable)
- [ ] Production/Vercel visual smoke test after deployment
- [ ] Production 20s MP4 rerender after deployment

## Result
Core patch implementation complete. Production visual/export re-verification remains after deployment.
