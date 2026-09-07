# Previz Studio v1.3.3

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다.

## v1.3.3 핵심

이번 버전은 외부 AI 연결이 아니라 **Camera Safety & Editing Stability**에 집중합니다.

- Camera position / target 숫자 검증
- Camera ↔ Target 최소 거리 보장
- Camera 지면 침투 방지
- static set geometry 내부 Camera 감지
- 위험한 Camera 이동은 마지막 정상 위치로 자동 복구
- `카메라 복구` 버튼
- 피사체가 프레임 밖이면 Camera warning 표시
- Shot 전환 시 Camera / Gizmo / Inspector 상태 재동기화
- Preview / PNG / MP4가 동일한 validated Canonical Camera 사용
- v1.3.2 Camera/Actor Gizmo, World/Local, Undo/Redo, Prompt Dock 유지
- 기본 30 FPS, 20초 = 600프레임 유지

## AI를 붙이지 않는 이유

외부 AI는 자연어를 더 유연하게 해석하는 데는 도움이 되지만 Camera가 벽 안에 들어가거나 Target이 비정상적이어서 검은 화면이 되는 문제를 해결하지 않습니다. v1.3.3은 이 문제를 deterministic 3D engine에서 해결합니다.

## Camera Safety

Camera 편집 상태는 세 단계로 구분합니다.

- **안전**: 정상 Camera transform
- **경고**: Camera는 유효하지만 주요 피사체가 프레임 밖
- **복구**: Camera가 지면/geometry/비정상 좌표로 들어가 마지막 정상 상태로 자동 복구됨

Camera Transform Inspector에서 상태와 복구 버튼을 확인할 수 있습니다.

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

## 기존 편집 기능

- Camera/Actor 선택
- Camera: 위치 / 회전 / 타겟 / 거리 / 높이 / 렌즈
- Actor: 위치 / 회전
- `W` 이동 / `E` 회전 / `T` Camera Target
- World / Local
- Undo / Redo
- Prompt Dock 접기/펼치기
- 24 / 25 / 30 / 60 FPS

## 다음 단계

v1.4.0에서는 Camera Keyframe Editing을 `Position + Target + Lens`부터 추가합니다.

## 검증 상태

- JavaScript syntax: PASS
- Automated tests: **38/38 PASS**
- 20 sec @ 30 FPS: 600 Camera states PASS
- invalid numeric / ground / bounds / Camera-Target distance tests: PASS
- local health/static server: PASS
- npm registry timeout으로 local Vite build는 재실행하지 못함
- Chromium localhost 접근이 환경 정책으로 차단되어 실제 Three.js Gizmo collision smoke는 Vercel 배포 후 확인
