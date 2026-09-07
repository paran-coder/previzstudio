# Previz Studio v1.0.0

A browser-based previz studio that turns natural-language scene descriptions into editable shot plans and visual references for film, advertising, and AI video workflows.

## v1.0.0 Vertical Slice

**Prompt -> Scene Document -> 3D Previz -> Camera Move -> Reference Frames / Manifest**

Default demo:

> 밤의 창고. 두 사람이 서로 마주 서 있고 카메라가 두 사람 사이로 천천히 이동한다.

The included prototype can:

- Interpret Korean/English scene keywords locally.
- Create warehouse/alley/office/studio scene metadata.
- Create 1–3 placeholder actors with persistent IDs.
- Interpret 18–120mm lens instructions.
- Interpret dolly-through, tracking, orbit, static, and dolly-forward camera intent.
- Play and scrub a camera move.
- Edit lens, duration, and dolly distance.
- Export start/middle/end PNG reference frames.
- Export deterministic Scene JSON.
- Export an AI-video reference-pack manifest with continuity metadata.

## Run

No package installation is required for the prototype.

```bash
cd previz-studio-v1.0.0
python3 -m http.server 4173
```

Then open `http://localhost:4173` in a modern browser.

Developer checks:

```bash
npm run check
npm test
```

`tests/browser-smoke.py` is the browser-level smoke test used during development.

## Product Positioning

Previz Studio is not a Blender clone. It is a directing-first tool centered around **Scene, Actor, Action, Camera, Shot, and Continuity**.

## Prototype vs. Production Renderer

The artifact uses dependency-free ES modules and a compact Canvas perspective renderer so the prototype remains portable and can run without installing packages.

The production migration target is:

- React + TypeScript + Vite
- Three.js with a WebGPU/WebGL 2 strategy
- Zustand state management
- Zod Scene Schema validation
- Server-side AI Director endpoint for broad natural-language understanding
- GLB/glTF asset library and animation clips

## Repository Structure

```text
previz-studio-v1.0.0/
├── context-notes.md
├── checklist.md
├── README.md
├── User manual.md
├── index.html
├── styles.css
├── package.json
├── preview.png
├── src/
│   ├── app.js
│   ├── director.js
│   ├── scene-engine.js
│   └── scene-schema.js
├── tests/
│   ├── director.test.mjs
│   └── browser-smoke.py
└── smoke-output/
    ├── previz-shot01-mid.png
    └── previz-scene-v1.0.0.json
```

## Architecture Principle

The language layer emits constrained scene data. It does not generate arbitrary rendering code. This keeps scene regeneration deterministic and makes continuity, editing, and export reliable.
