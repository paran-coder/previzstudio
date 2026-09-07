# Previz Studio v1.2.3 — Checklist

## Phase 0 — Required docs
- [x] `context-notes.md` updated before implementation
- [x] `checklist.md` updated before implementation
- [x] `README.md` updated before implementation
- [x] `User manual.md` updated before implementation

## Phase 1 — Canonical frame pipeline
- [x] One canonical Shot Camera frame render entry point
- [x] Preview uses canonical frame entry point
- [x] PNG capture uses canonical frame entry point
- [x] WebCodecs/MP4 export uses canonical frame entry point
- [x] MediaRecorder fallback uses canonical frame entry point
- [x] Output aspect isolated from viewport dimensions
- [x] Export pixel-resize cannot change composition
- [x] Edit View stays independent

## Phase 2 — Vite production build
- [x] Add Vite build scripts
- [x] Add npm `three` dependency
- [x] Remove runtime Three.js CDN import map
- [x] Build output targets `dist/`
- [x] Content-hashed JS/CSS assets configured
- [x] Vercel config serves Vite build output
- [x] Runtime build ID exposed
- [x] App/renderer/export build IDs are consistent

## Phase 3 — Regression protection
- [x] Preview/export source-path contract test
- [x] Canonical output-aspect test
- [x] Build configuration test
- [x] No CDN Three.js import-map test
- [x] Version/build ID test
- [x] Existing 20s timeline/camera tests pass
- [x] Existing edit-overview tests pass

## Phase 4 — Verification
- [x] JavaScript syntax checks pass
- [x] Automated tests pass
- [ ] Production build succeeds where dependencies are available
- [x] Hashed asset naming contract configured and tested
- [ ] Production Camera Preview vs video checked at 0.5/4.5/9.5/14.5/19.0s after user deployment

## Result
Core v1.2.3 implementation complete. Automated tests: **22/22 PASS**. The container cannot install npm dependencies/build Vite because registry access is unavailable, so the actual `npm run build` and Production frame comparison remain deployment verification items.
