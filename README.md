# Previz Studio v1.3.5 — Recovery Baseline

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다.

## 이번 버전의 의미
v1.3.5는 새 기능 버전이 아닙니다. 사용자가 직접 제공한 **정상 동작 v1.3.1 ZIP**으로 완전히 롤백한 뒤 다시 시작하기 위한 Recovery Baseline입니다.

v1.3.2~v1.3.4에서 추가했던 상태 관리와 Camera Safety 기능은 포함하지 않습니다.

## 보존되는 v1.3.1 기능
- 기본 **30 FPS**
- 24 / 25 / 30 / 60 FPS 선택
- 20초 @ 30 FPS = **600 frames**
- Camera Preview / PNG / MP4/WebM Canonical 16:9 Frame
- Camera 위치 / 높이 / 거리 / 타겟 직접 편집
- Camera Transform Gizmo
- Actor Transform Gizmo
- Manual Camera Override
- 2인 FIGHT 장면 파서
- Chase sequence
- Vite + hashed production assets

## 이번 버전에서 넣지 않는 기능
- Scene Tree 선택 동기화
- World / Local
- Prompt Dock 접기
- Undo / Redo
- Camera Safety / collision
- fallback camera
- Camera keyframes
- 외부 AI 연결

## 실행

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm run preview
```

검증:

```bash
npm test
npm run check
```

## 기본 출력

```text
1920 × 1080
30 FPS
20.0 sec
600 frames
```

## Recovery 개발 원칙
v1.3.5 Production이 정상임을 확인한 후 기능을 **한 번에 하나만** 추가합니다. 각 기능은 다음 단계 전에 Production에서 Preview/Render 회귀 검증을 통과해야 합니다.

## Baseline 검증
사용자 업로드 원본 v1.3.1에서 직접 확인:
- Automated tests: **32/32 PASS**
- JavaScript syntax check: **PASS**


## v1.3.5 Local Verification
- Automated tests: **34/34 PASS**
- JavaScript syntax check: **PASS**
- Runtime core hash lock: **PASS** — core renderer/app/sequence/exporter files are identical to the uploaded stable v1.3.1 baseline.
