# Previz Studio v1.0.0 — Checklist

## Stage 0 — Project Foundation
- [x] Create semantic-versioned project directory
- [x] Create context-notes.md
- [x] Create checklist.md
- [x] Create README.md
- [x] Create User manual.md

## Stage 1 — Architecture & UI Shell
- [x] Verify current web/3D stack assumptions
- [x] Define Scene JSON schema
- [x] Create zero-build ES module prototype shell (production React/Vite migration remains planned)
- [x] Build editor shell: scene panel / viewport / inspector / shots / prompt bar
- [x] Implement responsive layout and accessibility basics

## Stage 2 — 3D Vertical Slice
- [x] Create warehouse environment primitives
- [x] Create two placeholder actors
- [x] Create key/fill practical lighting
- [x] Create cinematic camera
- [x] Implement dolly-through movement
- [x] Add play/pause/reset controls

## Stage 3 — Natural Language Director
- [x] Define rule-based local director fallback
- [x] Parse demo prompt into SceneDocument
- [ ] Validate Director output with Zod
- [x] Regenerate scene from prompt

## Stage 4 — Previz Editing
- [ ] Select scene nodes
- [x] Edit shot duration
- [x] Edit lens
- [x] Edit camera move speed
- [x] Maintain scene continuity across regeneration

## Stage 5 — Reference Output
- [x] Capture start/mid/end frame PNGs
- [x] Export Scene JSON
- [x] Prepare reference-pack manifest

## Quality Gate
- [x] JavaScript syntax check passes (`npm run check`)
- [ ] TypeScript migration planned for v1.1.0 production shell
- [x] No runtime console errors in core path
- [x] Reduced-motion behavior considered
- [x] Keyboard-focusable primary controls

## Browser Smoke Test
- [x] Canvas renderer instantiates
- [x] Natural-language scene regeneration updates scene metadata
- [x] Timeline playback advances
- [x] Mid-frame PNG download succeeds
- [x] Scene JSON download succeeds
