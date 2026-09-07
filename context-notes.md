# Previz Studio v1.2.0 — Context Notes

## Product Intent
Previz Studio is a web-based 3D previsualization tool for film/advertising creators and AI-video creators.

The product promise is not “perfect natural-language understanding.” The promise is:

**quick scene blocking -> actor motion -> camera motion -> shot playback -> rendered reference video for AI video generation.**

Natural language is an optional accelerator that extracts only what the engine can actually express.

## v1.2.0 Primary Goal
Deliver a real 20-second rendered previz sequence that can be used as an AI-video reference.

Official validation target:
- Duration: 20 seconds
- Resolution: 1920×1080
- Frame rate: 24 fps
- Output preference: MP4 when the browser supports an MP4-capable encoder/mux path; WebM fallback otherwise
- Demo: night road chase with two actors and animated camera

## v1.2.0 Completion Criteria
1. Separate **편집 뷰** and **렌더 뷰**.
2. Character action system supports at least: `idle`, `walk`, `run`, `chase`, `turn`, `stop`.
3. Actor transforms actually change over time; animation is not only a visual pose.
4. Camera motion system supports at least: `static`, `dolly_in`, `dolly_out`, `track_follow`, `track_between`, `orbit`, `handheld_follow`.
5. A 20-second multi-shot sequence plays continuously on one master timeline.
6. Render view hides edit-only guides, labels, gizmos, grids and camera paths.
7. Export produces a real video file from the rendered sequence.
8. Start/mid/end frame references and scene/reference JSON remain available.
9. The official chase demo must complete end-to-end in the browser.

## Official Demo
> 밤의 도로. 한 사람이 도망치고 다른 사람이 뒤따라 쫓아간다. 카메라는 역동적으로 두 사람 사이를 오가며 추격한다.

Expected first-pass interpretation:
- Environment: `road`, `night`
- Actor 01: run away
- Actor 02: chase actor 01
- Sequence length: 20 sec
- Multi-shot coverage:
  - 0–4 sec: wide establishing
  - 4–9 sec: side tracking
  - 9–14 sec: handheld follow on pursuer
  - 14–20 sec: track between actors + push toward runner

## Natural-language Strategy
Natural language is a command extractor, not the core product.

The parser should extract only supported concepts:
- environment / time
- actor count
- actor action
- target relationship (e.g. chase target)
- camera motion
- lens hints
- pacing hints

Unknown or abstract phrases fall back to sensible defaults instead of blocking scene creation.

## Animation Strategy
- Prefer one consistent neutral previs mannequin.
- Motion clarity is more important than character detail.
- v1.2.0 can use procedural body motion when skeletal clips are unavailable, but root motion must be correct.
- Future versions may replace procedural animation with retargeted GLB skeletal clips without changing the action timeline API.

## Camera Strategy
Camera is a first-class timeline track.
- Camera position and target are evaluated continuously.
- Shot transitions are handled on the master 20-second sequence.
- Shot camera output is what the renderer/exporter records.

## Render Strategy
Two visual modes:

### 편집 뷰
Shows grid, actor IDs, paths, camera guides, safe frame, timeline information and debugging overlays.

### 렌더 뷰
Shows only the image needed for an AI-video reference: environment, actors, lighting, materials and shadows.

The export path renders the master sequence from the shot camera, not the director/orbit camera.

## AI-video Reference Strategy
Primary output:
- full sequence video
- per-shot start/mid/end PNG
- Scene JSON
- Reference Manifest JSON

The render does not need to be photoreal. It must communicate blocking, motion, framing, lens feel and continuity clearly.

## UI Principles
- Korean-first UI.
- 3D viewport remains the visual center.
- Distinguish editing state from final render state clearly.
- Timeline should read like a lightweight NLE/Blender dope-sheet hybrid, without Blender-level complexity.
- Structure before decoration; restrained motion and shadows.
- Keyboard accessibility and reduced-motion support.

## Branding / Metadata Requirement
v1.2.0 must include the previously generated 1200×630 OG image as `og.png` and add Open Graph + X/Twitter large-image metadata.

## Non-goals for v1.2.0
- Blender-class modeling/sculpting/UV tools
- photoreal final rendering
- full character rig editor
- advanced IK authoring UI
- generative 3D asset creation
- deep semantic language understanding
- external LLM dependency as a requirement
