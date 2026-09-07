# Previz Studio v1.3.3 — 사용자 매뉴얼

## 1. 기본 프로젝트
- 1920 × 1080
- 기본 30 FPS
- 기본 20초
- 600 frames

## 2. Camera 편집
Camera를 선택하면 Position, Rotation, Height, Distance, Target, Target Offset, Lens를 수정할 수 있습니다.

## 3. Camera Safety
Camera를 움직일 때 다음 상태를 자동 검사합니다.

- 숫자가 유효한가
- 지면 아래로 내려갔는가
- Camera와 Target이 너무 가까운가
- Camera가 static set geometry 내부에 들어갔는가

위험한 Camera transform은 저장하지 않고 마지막 정상 Camera 위치로 되돌립니다.

## 4. 카메라 상태
Inspector의 `카메라 상태`에서 현재 상태를 확인합니다.

- `안전 · 프레임 유효`
- `경고 · 피사체가 프레임 밖입니다.`
- `복구됨 · 카메라가 벽/지면 내부로 이동했습니다.`

## 5. 카메라 복구
`카메라 복구`는 해당 Shot의 마지막 정상 수동 Camera transform을 복원합니다.

`자동 구도로 되돌리기`는 수동 Camera를 제거하고 자동 Camera 계산으로 복귀합니다.

## 6. Transform Gizmo
- `W`: 이동
- `E`: 회전
- `T`: Camera Target
- `World / Local`: Transform space

잘못된 위치로 Gizmo를 드래그하면 자동으로 마지막 정상 위치로 복귀합니다.

## 7. Undo / Redo
- `Cmd/Ctrl + Z`: 실행 취소
- `Cmd/Ctrl + Shift + Z`: 다시 실행

## 8. Camera Preview
Camera Preview는 최종 렌더와 동일한 validated Canonical 16:9 Camera state를 사용합니다.

## 9. FPS / 영상 출력
기본 30 FPS이며 24 / 25 / 30 / 60 FPS를 지원합니다. 20초 / 30 FPS에서는 600프레임을 렌더합니다.

## 10. AI
v1.3.3에서는 외부 AI를 사용하지 않습니다. Camera Safety와 렌더 안정성은 AI가 아닌 3D 엔진이 담당합니다.
