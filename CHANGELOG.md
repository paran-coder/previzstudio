# Changelog

## v1.3.4

### Recovery
- Restored v1.3.1 runtime as the stable baseline.
- Removed v1.3.2 global Scene-clone Undo/Redo.
- Removed v1.3.3 per-frame Camera Safety/fallback logic.
- Reapplied only low-risk UX: Scene Tree Camera/Actor selection, selection HUD, World/Local transform space and collapsible prompt dock.
- Preserved 30 FPS / 600-frame default and canonical 16:9 Preview/PNG/MP4 pipeline.

### Validation target
- Repeated Edit View / Camera Preview switching must not produce a black viewport.
- Gizmo edits must survive view switching and continue rendering.
