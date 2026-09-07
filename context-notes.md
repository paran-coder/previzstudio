# Previz Studio v1.2.2 — Context Notes

## Patch Goal
v1.2.2 is a stability/accuracy release. No new creative features are added.

Two production issues are the focus:
1. Camera Preview must match PNG/MP4 output framing, not only camera transform.
2. The first Edit View camera must open on a useful scene overview instead of an obstructed or overly low angle.

UI hierarchy is also tightened after production review.

## Product Intent
Previz Studio is a browser-based previz tool for film/advertising creators and AI-video creators. The primary deliverable is a visual reference: blocking, actor motion, camera angle/movement, and a rendered sequence. Natural-language input is only a setup shortcut.

## Output Framing Contract
- The canonical output aspect ratio is taken from `sequence.width / sequence.height`.
- Camera Preview always displays that canonical output stage, centered inside the viewport with letterbox/pillarbox space when needed.
- The Shot Camera projection matrix always uses the canonical output aspect ratio.
- UI viewport dimensions must never overwrite the Shot Camera aspect.
- Edit View may use the full available viewport and its own aspect ratio.
- Camera Preview, PNG capture, WebCodecs export, and MediaRecorder export must share the same master-time scene/camera evaluator and output framing.

## Initial Edit Camera Contract
The first page load is a spatial workspace, not a rendered shot.

It must:
- frame all initial actors;
- show the early travel direction and enough forward path to understand blocking;
- include the first camera path where practical;
- use a three-quarter elevated overview rather than a ground-level or near-obstructed angle;
- derive target/radius from scene bounds instead of fixed world coordinates;
- avoid auto-reframing after the user manually orbits/zooms.

For the official chase scene, the desired feel is a 3/4 top overview: readable road direction, two actors, first camera route, minimal occlusion from roadside geometry.

## UI Direction
The provided `ui-polish` reference remains the hierarchy workflow: structure first, hierarchy second, polish last.
The Lamborghini-inspired tokens are used only as reference for dark-surface depth, not copied as a brand skin.

### Surface hierarchy
- App background: #05070A
- Workspace: #090D11
- Side panels: #11171D
- Timeline / elevated module: #151C23
- Elevated card: #1B232B
- Interactive/hover: #222C35
- Border: #323E49

Depth should come from surface-lightness changes and precise borders, not decorative shadows.

### Accent discipline
- Lime #C6FF4A: primary/current/playhead only
- Cyan #4CB8E8: actor/action semantics
- Purple #9A7BFF: camera semantics

### Typography target
- Brand: 16px
- Panel title: 13px
- Current shot title: 14px
- Section title: 11px
- General Korean UI/body: 12px
- Field values: 12px
- Timeline labels/clips: 11px
- Buttons: 12px
- Technical metadata: 9.5–10px minimum

## Official Regression Sequence
20-second night road chase, 24fps, 1920x1080:
- Shot 01: rear 3/4 wide
- Shot 02: side tracking
- Shot 03: rear chase / handheld follow
- Shot 04: dynamic between / push

## Completion Criteria
- Camera Preview is a true 16:9 output stage at 1920x1080 projects regardless of UI panel aspect.
- Preview and export use the same Shot Camera aspect, FOV, transform, actor state, cut timing, and lighting.
- Representative frames at 0s / 4s+ / 9s+ / 14s+ / 19s are composition-equivalent between preview and output.
- First Edit View load gives a readable blocking overview with actors/path visible and no dominant foreground obstruction.
- User orbit/zoom is preserved after interaction.
- Korean text hierarchy remains readable at 1920x1080 production scale.
- Runtime/unit regression tests pass.
