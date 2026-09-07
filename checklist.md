# Previz Studio v1.1.0 — Checklist

## Phase 0 — Project setup
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`

## Phase 1 — Architecture
- [x] Buildless browser ESM + Node API/static server
- [x] v1.1.0 Scene JSON Schema
- [x] OpenAI Responses API Director endpoint
- [x] Structured Outputs strict JSON schema
- [x] Local deterministic fallback Director
- [x] Multi-shot planner
- [x] Server-only API key handling
- [x] `.env` static exposure protection

## Phase 2 — 3D
- [x] Three.js renderer integration path
- [x] WebGPURenderer + WebGL 2 fallback strategy
- [x] GLTFLoader asset resolver
- [x] `actor-neutral.glb`
- [x] `sedan-blockout.glb`
- [x] `warehouse-blockout.glb`
- [x] Procedural/Canvas fallback renderer
- [x] Director / Shot Camera modes
- [x] Camera path visualization

## Phase 3 — UI
- [x] Korean primary menus and controls
- [x] Multi-shot strip
- [x] Shot selection
- [x] Korean shot inspector
- [x] AI Director state badge
- [x] Renderer state badge
- [x] Responsive layout
- [x] Reduced-motion behavior

## Phase 4 — Export
- [x] Scene JSON
- [x] Current-shot start/mid/end PNG
- [x] Multi-shot AI reference manifest

## Phase 5 — Verification
- [x] JavaScript syntax check
- [x] Unit tests
- [x] AI Director request contract test
- [x] Browser smoke test
- [x] Browser page errors = 0
- [x] Default 4-shot test
- [x] Regeneration prompt test
- [x] GLB delivery test
- [x] `.env` block test
- [ ] Live external LLM request with user-owned API key

## Result
Automated tests: **6/6 PASS**.

Live external LLM verification requires a real `OPENAI_API_KEY`; the server integration and request/response contract are implemented and mock-tested.

- [x] v1.1.0 최종 패키지 생성
