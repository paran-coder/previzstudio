# Previz Studio v1.3.4

v1.3.4 is a **recovery release**. It returns the runtime to the stable v1.3.4 architecture, then reapplies only low-risk editing UX improvements.

The priority is not adding features. The priority is restoring the behavior that already worked: **Edit View → Camera Preview → 30 FPS render** without black-screen regressions.

## What remains
- 1920 × 1080 output
- default 30 FPS
- 20 s default sequence = 600 frames
- 24 / 25 / 30 / 60 FPS project options
- canonical 16:9 Camera Preview / PNG / MP4 pipeline
- deterministic chase/fight scene parser
- Camera manual position/target/lens editing
- Actor transform editing
- Three.js TransformControls
- Camera/Actor selection from Scene Tree
- World / Local transform space
- collapsible prompt dock

## What was intentionally removed
- v1.3.2 global Scene clone Undo/Redo
- v1.3.3 per-frame Camera Safety and fallback-camera substitution
- per-frame geometry obstacle scanning

Those systems increased state complexity inside the render path and are not part of this recovery release.

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Recovery acceptance
The release is accepted only when Production confirms:

1. Edit View loads normally.
2. Camera Preview displays normally.
3. Repeated Edit/Preview switching does not create a black viewport.
4. Camera/Actor Gizmo editing does not break preview.
5. 20 s / 30 FPS render produces 600 frames.
6. Camera Preview and final MP4 retain the same framing.

## Automated verification
- JavaScript syntax: PASS
- Unit/contract tests: **35/35 PASS**
- 30 FPS 20-second sequence: 600-frame evaluator PASS
- Recovery contract: Undo/Redo and Camera Safety hot-path identifiers absent

Production browser switching/Gizmo/render remains the final acceptance step.
