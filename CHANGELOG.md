# Changelog

## v1.3.2 — Camera Editing UX

- Camera/Actor 선택 상태를 Scene Tree / Viewport / Inspector에서 통일
- Inspector 최상단에 선택 오브젝트 hierarchy 추가
- Camera/Actor contextual Transform Inspector
- Transform mode: 이동 / 회전 / 타겟
- World / Local Transform space 추가
- Camera Target mode에서 Local space 비활성화 및 World 고정
- Camera/Actor Transform Undo / Redo 스택 추가
- Gizmo drag를 하나의 Undo transaction으로 기록
- `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z` 단축키 추가
- Prompt Dock 접기/펼치기 추가
- 접힌 상태에서도 한 줄 Prompt command bar와 장면 생성 유지
- Scene Tree selected/current-shot hierarchy 보정
- Viewport selection HUD 추가
- Timeline/Inspector typography 소폭 보정
- v1.3.1 30 FPS / 600 frame / Canonical Preview=Render 구조 회귀 유지

## v1.3.1

- 기본 FPS 30
- 24 / 25 / 30 / 60 FPS 선택
- 20초 30 FPS = 600 frames

## v1.3.0

- Camera/Actor Transform Gizmo
- Camera position / height / distance / target editing
- manual camera override
- fight prompt / FIGHT action / multi-shot directing
