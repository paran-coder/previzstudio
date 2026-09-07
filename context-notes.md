# Previz Studio v1.3.5 — Context Notes

## Recovery Baseline
v1.3.5는 사용자가 직접 업로드한 `previz-studio-v1.3.1(1).zip`을 유일한 코드 기준으로 복원한 Recovery Baseline이다.

v1.3.2~v1.3.4의 코드는 기준으로 사용하지 않는다. 해당 버전에서 추가했던 Scene Tree 선택 동기화, World/Local, Prompt Dock 접기, Undo/Redo, Camera Safety 계층은 v1.3.5에 재적용하지 않는다.

## Why We Reset
v1.3.1 Production에서는 다음 항목이 실제 사용자 영상으로 검증되었다.
- 30 FPS / 20초 / 600프레임 MP4
- Camera Preview와 Render의 16:9 구도 일치
- Camera/Actor Transform
- Fight/Chase parser

반면 v1.3.2 이후 상태 관리와 Camera Safety를 동시에 추가하면서 `편집 뷰 → 카메라 프리뷰` 전환에서 검은 화면 회귀가 발생했다.

## v1.3.5 Goal
1. 업로드된 v1.3.1의 런타임 동작을 그대로 보존한다.
2. 버전/문서/빌드 식별자만 v1.3.5 Recovery Baseline으로 갱신한다.
3. 새 UX 기능이나 Camera Safety 로직은 추가하지 않는다.
4. 이후 기능은 한 번에 하나만 추가하고 Production 검증 후 다음 단계로 넘어간다.

## Preserved Stable Features
- 기본 30 FPS
- 24 / 25 / 30 / 60 FPS
- 20초 @ 30 FPS = 600프레임
- Canonical 16:9 Camera Preview
- Preview / PNG / MP4/WebM 공통 Canonical Frame 경로
- Camera 위치 / 높이 / 거리 / 타겟 편집
- Camera Transform Gizmo
- Actor Transform Gizmo
- Manual Camera Override
- two-actor FIGHT parser
- Chase sequence
- Vite hashed production assets

## Explicitly Excluded From v1.3.5
- Scene Tree → Inspector/Gizmo 선택 동기화
- World / Local Transform Space
- Prompt Dock collapse
- Undo / Redo
- Camera Safety / geometry collision scan
- automatic fallback camera
- per-frame camera validation
- Camera keyframes
- external AI / LLM integration

## Development Rule From This Baseline
- v1.3.5가 Production에서 v1.3.1과 동일하게 안정적인지 먼저 확인한다.
- 이후 한 버전에는 핵심 기능 하나만 추가한다.
- 기능 추가 전후에 Preview/Render 회귀를 반드시 확인한다.
- Production에서 실패하면 해당 기능만 되돌리고 baseline은 유지한다.

## Baseline Verification
업로드된 원본 v1.3.1 ZIP에서 직접 실행:
- `npm test`: 32/32 PASS
- `npm run check`: PASS
- package / APP / Scene version: 1.3.1 일치 확인

v1.3.5는 이 소스에서 문서와 버전 식별자만 변경한 복구 기준점으로 만든다.


## v1.3.5 Local Verification Result
- Automated tests: 34/34 PASS
- JavaScript syntax check: PASS
- Recovery lock test: PASS
- `src/app.js`, `src/renderer-three.js`, `src/sequence.js`, `src/video-exporter.js` are byte-identical to the uploaded v1.3.1 baseline.
- Post-v1.3.1 regression state symbols (`transformSpace`, `lastSafeCamera`, `cameraSafety`, `fallbackCamera`, `undoStack`, `redoStack`) are absent from the recovery runtime.
- Production verification remains pending after user deployment.
