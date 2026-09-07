# Previz Studio v1.2.1 — Context Notes

## Patch Goal
Previz Studio v1.2.1 fixes two product-critical issues discovered in v1.2.0:
1. Camera preview and exported video must evaluate the exact same shot camera at the same master time.
2. The dark UI must regain readable hierarchy through surface layering, typography scale, and restrained accent usage.

## Product Intent
Previz Studio is a browser-based previz tool for film/advertising creators and AI-video creators. The primary deliverable is a reusable visual reference: blocking, actor motion, camera angle/movement, and a rendered sequence. Natural-language input is only a setup shortcut.

## v1.2.1 Camera Rules
- Editing view remains a free director/orbit camera used only for spatial inspection.
- Camera Preview uses the same `evaluateCameraAtTime()` result as export.
- Video export must not maintain a separate camera path implementation.
- Shot changes use the master sequence time and deterministic cut boundaries.
- Default shot placement must derive from actor blocking + travel vector + lens/shot archetype, not arbitrary hard-coded world coordinates.
- Shot overlay appears briefly after a cut with shot number, lens, and camera archetype.

## v1.2.1 UI Direction
The UI is informed by the provided ui-polish workflow and Lamborghini-inspired design tokens, but does not copy either visual system.

### Surface hierarchy
- Abyss/background: #06080A
- Workspace: #0B0F13
- Panel: #12171C
- Elevated panel: #181F26
- Interactive/selected: #202933
- Border: #2A343E

Depth is created primarily through surface-lightness shifts and 1px borders rather than heavy shadows.

### Accent discipline
- Product primary: #C6FF4A, reserved for primary CTA/current playhead/current selection.
- Informational cyan: #4CB8E8, reserved for actor/action data and info feedback.
- Camera purple: #9A7BFF, reserved for camera track and camera-related affordances.
- Do not scatter accent colors decoratively.

### Typography hierarchy
- Product/brand: 15px / 700
- Panel title: 12px / 700
- Current shot title: 13px / 700
- Section title: 10px / 650
- Body: 11px / 1.5
- Field label: 10.5–11px
- Field value: 11–12px / 600
- Button: 11px / 650
- Primary CTA: 12px / 700
- Timeline clip and track: 10px / 600
- Metadata: 9px only where truly secondary
- Avoid applying wide uppercase tracking to Korean section labels.

## Reference UI Principles
- Structure before decoration.
- Viewport is the visual center of gravity.
- Timeline is the second most important module.
- Shot inspector is third.
- Scene tree is supporting navigation.
- Renderer/backend status is metadata and must never compete with shot information.
- Primary and secondary actions must not visually compete.

## Official Regression Sequence
20-second night road chase, 24fps, 1920x1080:
- Shot 01: rear 3/4 wide establish
- Shot 02: side tracking
- Shot 03: rear chase / handheld follow
- Shot 04: dynamic between / push

## Completion Criteria
- Preview and exported frames match at representative master times.
- First shot starts from a blocking-derived rear 3/4 angle instead of an arbitrary elevated orbit position.
- Camera Preview auto-cuts through all sequence shots.
- Edit View remains clearly labeled as a non-render spatial workspace.
- Panel surfaces are distinguishable without relying on shadows.
- No core Korean UI label is below 10px.
- Only metadata may use 9px.
- Runtime errors: 0 in smoke test.
