# Previz Studio v1.3.5 — Recovery Baseline 사용자 매뉴얼

## 1. 이 버전은 무엇인가요?
v1.3.5는 새 기능을 추가한 버전이 아니라, 정상 동작이 확인된 v1.3.1 코드로 되돌아간 복구 기준 버전입니다.

## 2. 기본 프로젝트
- 해상도: 1920 × 1080
- 기본 FPS: 30 FPS
- 길이: 20초
- 총 프레임: 600 frames

지원 FPS:
- 24
- 25
- 30
- 60

## 3. 장면 만들기
하단 프롬프트에 표현 가능한 장면을 입력한 뒤 `장면 만들기`를 누릅니다.

예시:
> 두 사람이 격렬하게 하는 격투씬, 카메라가 다양한 각도로 익사이팅한 앵글로 따라간다.

## 4. 편집 뷰
편집 뷰에서 Actor, Camera, 동선과 Transform Gizmo를 확인합니다.

## 5. Camera 편집
오른쪽 Camera Transform 영역에서 다음을 수정할 수 있습니다.
- 위치 X/Y/Z
- 높이
- 거리
- Target
- Target Offset
- Start / End Camera Transform

수동 수정된 Camera는 Manual Override가 적용되며 `자동 구도로 되돌리기`로 복귀할 수 있습니다.

## 6. Transform Gizmo
- W: 이동
- E: 회전
- T: Camera Target

Actor도 위치와 회전을 직접 수정할 수 있습니다.

## 7. 카메라 프리뷰
`카메라 프리뷰`는 최종 렌더와 동일한 Canonical 16:9 Camera Frame을 사용합니다.

## 8. 영상 출력
`프리비즈 영상 렌더`를 누르면 프로젝트 FPS와 길이를 사용해 MP4/WebM을 생성합니다.

기본값에서는 20초 × 30 FPS = 600프레임입니다.

## 9. v1.3.5에서 없는 기능
복구 안정성을 위해 다음 기능은 아직 넣지 않습니다.
- World / Local
- Undo / Redo
- Camera Safety
- Prompt 접기
- Camera keyframe

이 기능들은 Recovery Baseline이 Production에서 정상 확인된 이후 하나씩 다시 추가합니다.
