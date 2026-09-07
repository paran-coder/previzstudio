# Previz Studio v1.2.3 — Context Notes

## Release Goal
v1.2.3 is a render-consistency and deployment-integrity release. No new creative features are added.

Production review of v1.2.2 showed that shot order and actor timing were close, but Camera Preview and downloaded video could still differ in composition. The release therefore removes duplicated preview/export frame paths and eliminates stale mixed-version module delivery.

## Product Intent
Previz Studio is a browser-based previz tool for film/advertising creators and AI-video creators. The core output is a visual reference containing blocking, actor motion, shot camera, timing, and a rendered sequence. Natural-language input remains a deterministic setup shortcut.

## Canonical Frame Contract
There is exactly one output-frame contract for Shot Camera media.

For every master time `t`:
1. evaluate actor state;
2. evaluate shot/camera state;
3. apply the fixed project output aspect (`sequence.width / sequence.height`);
4. render the canonical frame;
5. reuse that same path for Camera Preview, PNG capture, WebCodecs MP4, and MediaRecorder fallback.

Rules:
- Preview panel dimensions never change Shot Camera FOV/aspect.
- Preview only changes the CSS presentation size of the canonical frame.
- Export resolution may change pixel dimensions, never composition.
- Edit View remains a separate free camera.
- Camera Preview, PNG, and video may differ in pixel resolution but not framing, actor state, lighting, lens, or cut timing.

## Deployment Integrity Contract
v1.2.3 uses Vite as the production build system.

- `three` is an npm dependency, not a runtime CDN import map.
- Production JS/CSS are emitted with content-hashed filenames.
- `index.html` references the generated build graph.
- A single app build identifier is exposed at runtime so UI, renderer, schema, and export pipeline can be verified as the same release.
- Development source remains readable under `src/`, but Vercel serves `dist/`.

This prevents a new HTML shell from accidentally running an older renderer module from cache.

## Initial Edit Camera
The v1.2.2 derived 3/4 elevated overview remains the default edit entry view. It is not part of the canonical Shot Camera frame and must not affect output.

## UI Scope
UI final polish is intentionally deferred until Production proves Preview/PNG/MP4 frame consistency. v1.2.3 only adds small build/debug metadata needed to verify release integrity.

## Official Regression Sequence
20-second night road chase, 24fps, 1920×1080:
- Shot 01: rear 3/4 wide
- Shot 02: side tracking
- Shot 03: rear chase / handheld follow
- Shot 04: dynamic between / push

## Completion Criteria
- Preview, PNG, and video invoke the same canonical frame render entry point.
- Shot Camera aspect is always output aspect.
- Representative 0.5 / 4.5 / 9.5 / 14.5 / 19.0 second frames are composition-equivalent between Preview and output after Production deployment.
- Vite production build emits hashed JS/CSS assets.
- Runtime build badge reports v1.2.3 consistently.
- Existing initial Edit View overview remains stable.
- Syntax/unit/build-contract tests pass.
