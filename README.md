# Previz Studio v1.3.2

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다.

## v1.3.2 핵심

이번 버전은 새 카메라 기능을 추가하기보다 **Camera / Actor Editing UX를 실제 편집 흐름으로 정리**합니다.

- 선택 오브젝트가 Scene Tree / Viewport / Inspector에서 일관되게 표시
- Camera / Actor contextual Inspector
- Transform Gizmo mode
  - 이동
  - 회전
  - 타겟(Camera)
- World / Local Transform space
- Camera/Actor 숫자 입력과 Gizmo 동기화
- Undo / Redo 기본 스택
- Prompt Dock 접기/펼치기
- Timeline / Inspector / Scene Tree typography hierarchy 보정
- v1.3.1의 30 FPS / 16:9 Canonical Preview / Preview=Render 구조 유지

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

## Transform 편집

선택한 오브젝트에 따라 오른쪽 Inspector가 달라집니다.

### Camera
- 위치 X/Y/Z
- 회전
- 높이
- 피사체 거리
- 타겟
- 타겟 오프셋
- 렌즈
- 시작 / 끝 Camera transform

### Actor
- 위치 X/Y/Z
- 회전
- Action 상태

단축키:

```text
W = 이동
E = 회전
T = 카메라 타겟
Cmd/Ctrl + Z = 실행 취소
Cmd/Ctrl + Shift + Z = 다시 실행
```

Transform space는 `World / Local`로 전환할 수 있습니다.

## Prompt Dock

프롬프트는 하단에서 접을 수 있습니다. 접힌 상태에서는 한 줄 command bar만 남아 Viewport와 Timeline 공간을 더 확보합니다. 다시 펼쳐도 입력한 문장은 유지됩니다.

## FPS / 출력

기본값은 30 FPS이며 24 / 25 / 30 / 60 FPS를 지원합니다.

20초 기본 시퀀스는 30 FPS에서 600프레임입니다. Camera Preview / PNG / MP4/WebM은 동일한 Canonical Frame 경로를 사용합니다.

## 다음 버전

v1.4.0에서는 Camera Keyframe Editing을 추가할 예정입니다.

- Position
- Target
- Lens
- Start / Mid / End keyframes

## 검증 상태

- JavaScript syntax check: PASS
- Automated tests: **34/34 PASS**
- 20 sec @ 30 FPS = 600 frame regression: PASS
- Canonical Preview / PNG / Video shared path: PASS
- Camera/Actor Transform regression: PASS
- 현재 실행 환경에서는 Chromium의 localhost/file 접근이 정책상 차단되어 UI click smoke test를 실행하지 못했습니다.
- npm registry timeout으로 local Vite production build 재실행은 하지 못했습니다. Vercel 배포 후 실제 Gizmo/Undo/Prompt collapse 조작을 최종 확인합니다.
