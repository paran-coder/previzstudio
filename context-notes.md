# Previz Studio v1.3.4 — Context Notes

## Purpose
v1.3.4 is a recovery release based on the stable v1.3.4 runtime. It removes the regressions introduced by v1.3.2/v1.3.3 while preserving the proven 30 FPS canonical preview/render pipeline.

## Stable baseline
- Base code: v1.3.4
- Default output: 1920 × 1080, 30 FPS, 20 seconds, 600 frames
- Camera Preview / PNG / MP4 use the canonical 16:9 frame pipeline
- Fight/chase parser, Camera/Actor manual editing and TransformControls remain available

## Recovery scope
1. Remove v1.3.2 global Scene clone Undo/Redo architecture.
2. Remove v1.3.3 per-frame Camera Safety/fallback logic from render hot paths.
3. Keep only low-risk UX improvements from later versions:
   - Scene Tree selection of Camera/Actor
   - clear selection state in Inspector/Viewport
   - World/Local transform space toggle
   - collapsible prompt dock
4. Preserve v1.3.4 camera evaluation, preview and export behavior.

## Explicit non-goals
- No automatic camera collision rollback in this release.
- No per-frame geometry safety scan.
- No global Undo/Redo in this release.
- No new AI/LLM dependency.
- No Camera Keyframe system yet.

## Completion criteria
- Edit View works on first load.
- Camera Preview works without black-frame regression.
- Repeated Edit View ↔ Camera Preview transitions do not corrupt camera state.
- Camera/Actor Gizmo edits continue to affect preview correctly.
- 20 s / 30 FPS / 600-frame export remains valid.
- Preview and render keep the canonical 16:9 composition.

## Next version
After recovery is confirmed in Production, Camera Keyframes can proceed separately with Position + Target + Lens.

## Verification result
Automated verification: 35/35 PASS. Production browser acceptance remains required for repeated Edit/Preview switching and final MP4 output.
