# Previz Studio v1.0.0 — Context Notes

## Product Intent
Previz Studio is a web-based AI film previz tool for both film/advertising creators and AI video creators.

Core promise: natural language -> structured scene -> editable 3D previz -> reusable reference outputs.

## Primary User Groups
1. Film / advertising teams: blocking, camera, lens, shot planning, storyboard and previz.
2. AI video creators: stable shot references, continuity, camera motion references and exportable frames/video.

## v1.0.0 Vertical Slice
The first working slice must complete this loop:

1. User types a scene in natural language.
2. Director layer converts it to a deterministic Scene JSON schema.
3. Web 3D renderer composes environment, actors, props, lights and camera.
4. User can inspect and edit basic shot/camera properties.
5. User can play the camera move and capture reference frames.

## Demo Scene
Default demo prompt:

> 밤의 창고. 두 사람이 서로 마주 서 있고 카메라가 두 사람 사이로 천천히 이동한다.

## Product Principles
- Do not recreate Blender; optimize for directing and previz.
- AI produces constrained scene data, not arbitrary renderer code.
- Scene continuity is a first-class concept.
- Strong structure before visual decoration.
- 3D viewport remains the visual center of gravity.
- Motion should be restrained and functional.
- UI should remain usable with keyboard and reduced-motion preferences.

## Initial Technical Direction
- v1.0.0 artifact prototype: dependency-free ES modules + Canvas perspective renderer for offline portability
- Production renderer target: Three.js with WebGPU/WebGL 2 strategy
- Production application shell target: React + TypeScript + Vite
- Production state/schema target: Zustand + Zod
- Browser-first rendering; server rendering is future scope

## Non-goals for the First Slice
- Mesh modeling / sculpting / UV editing
- Full Blender timeline parity
- Generative 3D asset creation
- Photoreal offline rendering
- Complex skeletal animation authoring
