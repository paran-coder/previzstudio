# Previz Studio v1.2.1 — 사용자 매뉴얼

## 1. 보기 모드

### 편집 뷰
공간, 인물 동선, 카메라 경로를 검토하는 작업용 자유 카메라입니다. 최종 출력 화면이 아닙니다.

### 카메라 프리뷰
최종 프리비즈 영상과 동일한 shot camera를 보여줍니다. 이 모드에서 재생하면 master timeline을 따라 샷이 자동 전환됩니다.

## 2. 20초 마스터 타임라인

Shot / Actor 01 / Actor 02 / Camera 트랙을 함께 확인합니다. 현재 샷, 액션, 카메라 무빙은 색상과 텍스트 hierarchy로 구분됩니다.

## 3. 샷 전환

카메라 프리뷰 재생 중 샷 경계에서 자동 컷됩니다. 컷 직후 잠깐 `SHOT 02 · 35mm · SIDE TRACKING` 형태의 오버레이가 표시됩니다.

## 4. 카메라 자동 배치

공식 추격 장면의 shot camera는 임의의 고정 좌표가 아니라 배우 위치와 진행 방향을 기준으로 계산됩니다. 첫 샷은 rear 3/4 wide, 이후 side tracking / rear chase / between tracking 규칙을 사용합니다.

## 5. 렌더

카메라 프리뷰와 영상 렌더는 동일한 camera evaluator를 사용합니다. 따라서 프리뷰에서 확인한 구도와 cut timing이 출력 영상에도 유지되어야 합니다.

기본 출력:
- 1920 × 1080
- 24fps
- 약 20초
- MP4 우선, 브라우저 기능에 따라 호환 포맷 fallback

## 6. UI hierarchy

- 가장 중요한 정보: 3D viewport / 현재 shot
- 두 번째: master timeline
- 세 번째: shot inspector
- 네 번째: scene tree
- renderer 상태/기술 정보: 보조 metadata

Lime은 primary action/current selection, cyan은 actor/action 정보, purple은 camera 정보에 제한해서 사용합니다.
