# Changelog

## 1.1.0 — 2026-09-07

### Added
- OpenAI Responses API AI Director endpoint with Structured Outputs.
- Server-side API-key handling and local fallback Director.
- Automatic multi-shot directing.
- Three.js WebGPU/WebGL renderer path.
- GLTFLoader-based asset resolver.
- Actor, sedan and warehouse GLB blockout assets.
- Korean editor menus and shot inspector.
- Multi-shot reference manifest export.
- AI Director / renderer status indicators.

### Changed
- Product flow now centers on Scene → Shot → Camera → Reference.
- Default confrontation demo expanded from one shot to four shots.
- UI copy translated to Korean-first terminology.

### Security
- `.env` and non-public project files are not exposed by the static server.
- API credentials remain server-side.

### Verification
- Syntax check PASS.
- Automated tests 6/6 PASS.
- Browser smoke PASS with zero page errors.
