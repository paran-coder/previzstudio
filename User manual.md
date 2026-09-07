# Previz Studio v1.3.2 — 사용자 매뉴얼

## 1. 기본 프로젝트
- 1920 × 1080
- 기본 30 FPS
- 기본 20초
- 600 frames

## 2. 오브젝트 선택
왼쪽 Scene Tree에서 Camera 또는 Actor를 선택합니다. 선택 상태는 Scene Tree, 3D Viewport, 오른쪽 Inspector에 동시에 반영됩니다.

## 3. Camera 편집
Camera를 선택하면 오른쪽 Inspector에서 다음을 수정할 수 있습니다.

- Position X/Y/Z
- Rotation
- Height
- Distance
- Target
- Target Offset
- Lens
- Start / End Camera Transform

## 4. Actor 편집
Actor를 선택하면 Position과 Rotation을 수정할 수 있습니다. Actor 위치 변경은 해당 Actor의 Action Path 전체에 offset으로 반영됩니다.

## 5. Transform Gizmo
상단 Transform 도구에서 편집 모드를 선택합니다.

- 이동 — `W`
- 회전 — `E`
- 타겟 — `T` (Camera 전용)

Inspector 숫자 입력과 3D Gizmo는 같은 Transform 값을 편집합니다.

## 6. World / Local
`World`는 씬 좌표축을 기준으로 움직입니다. `Local`은 선택 오브젝트의 회전된 축을 기준으로 움직입니다.

## 7. Undo / Redo
- `Cmd/Ctrl + Z`: 실행 취소
- `Cmd/Ctrl + Shift + Z`: 다시 실행

Camera/Actor Transform 수정과 자동 카메라 복귀 상태를 되돌릴 수 있습니다.

## 8. Prompt Dock
하단 Prompt Dock은 접기/펼치기가 가능합니다. 접어도 현재 입력한 문장은 유지됩니다. Viewport와 Timeline을 넓게 보고 싶을 때 접어 사용합니다.

## 9. Camera Preview
`카메라 프리뷰`는 최종 출력과 동일한 Canonical 16:9 Frame을 사용합니다.

## 10. 영상 출력
기본 30 FPS이며 24 / 25 / 30 / 60 FPS 선택을 지원합니다. 20초 / 30 FPS에서는 600프레임을 렌더합니다.

## 11. 다음 단계
v1.4.0에서는 Camera Position / Target / Lens의 Keyframe 편집을 Timeline에 추가할 예정입니다.
