# Previz Studio v1.1.0 — Context Notes

## Product Intent
Previz Studio is a web-based AI film previz tool for both film/advertising creators and AI video creators.

Core promise: natural language -> structured multi-shot scene -> editable 3D previz -> reusable AI-video references.

## v1.1.0 Goals
1. Replace the local-only director as the primary path with a real server-side LLM Director using OpenAI Responses API Structured Outputs.
2. Keep a local deterministic fallback so the demo remains usable without an API key.
3. Replace the prototype Canvas renderer with a Three.js renderer and production-oriented GLB/glTF asset resolver architecture.
4. Add first-pass multi-shot automatic directing.
5. Convert the main product UI and menus to Korean.
6. Preserve continuity IDs across shots.

## Recommended Product Priority
Multi-shot automatic directing precedes complex character animation. Shot structure, lens selection, camera placement and continuity are the product's directing core; character animation is layered on top in the next minor version.

## Default Demo
> 밤의 창고. 두 사람이 서로 마주 서 있다. 와이드로 공간을 보여준 뒤 두 사람의 대치를 교차로 보여주고, 마지막에는 두 사람 사이로 카메라가 천천히 이동한다.

## UI Principles
- 3D viewport is the visual center of gravity.
- Korean-first labels; standard film terminology can retain short English abbreviations where clearer (e.g. mm, FPS).
- Structure before decoration.
- Dark editing environment with restrained contrast and motion.
- Clear hierarchy: Project -> Scene -> Shot -> Object -> Property.
- Accessibility: keyboard focus, readable contrast, reduced-motion support.

## Renderer Direction
- Three.js `WebGPURenderer` where supported, WebGL 2 fallback.
- glTF/GLB is the canonical runtime asset format.
- Procedural fallback geometry is used when a GLB asset is missing.

## AI Director Direction
- Server endpoint owns API credentials.
- LLM emits constrained JSON only, never renderer code.
- JSON Schema validates environment, actors, props, lights, shots, lens, timing and camera movement.
- Local fallback parser is always available for offline smoke tests.

## Non-goals
- Blender-class modeling/sculpting/UV tools.
- Full skeletal animation authoring.
- Photoreal final rendering.
- Generative 3D asset synthesis.
- Multi-user collaboration.

## v1.1.0 Implementation Note
The delivered vertical slice uses buildless browser ES modules plus a small Node server so it can run without `npm install`. Three.js r185.1 is pinned through an import map; if that remote dependency is unavailable the application falls back to the local Canvas renderer. A future production packaging pass can bundle Three.js locally with Vite without changing the Scene Document or renderer interfaces.
