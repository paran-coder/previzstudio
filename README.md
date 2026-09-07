# Previz Studio v1.3.1

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다.

## v1.3.1 핵심

- 기본 출력 프레임레이트를 **30 FPS**로 변경
- 프로젝트 FPS 선택
  - 24 FPS
  - 25 FPS
  - 30 FPS — 기본값
  - 60 FPS
- Shot 시간은 초 단위로 유지
- FPS 변경 시 frame count만 재계산
- Preview / Actor / Camera / PNG / MP4/WebM이 같은 `sequence.fps` 사용
- 20초 기본 시퀀스는 30 FPS에서 **600프레임**
- v1.3.0 Camera/Actor Transform Gizmo와 Manual Camera Override 유지
- Camera Preview / PNG / Video Export Canonical Frame 유지

## 기본 실행

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm run preview
```

## FPS 동작

기본 프로젝트는 다음과 같습니다.

```text
1920 × 1080
30 FPS
20.0 sec
600 frames
```

지원 FPS별 20초 frame count:

| FPS | Frames |
| ---: | ---: |
| 24 | 480 |
| 25 | 500 |
| 30 | 600 |
| 60 | 1200 |

FPS를 변경해도 Shot의 0–4초, 4–9초 같은 시간 구간은 변하지 않습니다. 프레임 샘플링 수만 변경됩니다.

## Camera / Actor Editing

v1.3.0에서 추가된 기능을 그대로 유지합니다.

- Camera 위치 X/Y/Z
- Camera 높이 / 거리 / 타겟
- Start / End camera transform
- Camera Transform Gizmo
- Actor 이동 / 회전 Gizmo
- Manual camera override
- `자동 구도로 되돌리기`

## 출력

Camera Preview, PNG reference, MP4/WebM export는 동일한 Canonical Frame 경로를 사용하고 선택된 프로젝트 FPS를 공유합니다.

## 자연어 예시

```text
두 사람이 격렬하게 하는 격투씬, 카메라가 다양한 각도로 익사이팅한 앵글로 따라간다.
```

Actor 2명, FIGHT action, 멀티샷 카메라로 블로킹됩니다.

## 검증 상태

- JavaScript syntax check: PASS
- Automated tests: **32/32 PASS**
- 20 sec @ 30 FPS: **600 frames PASS**
- 24/25/30/60 FPS frame-count contract: PASS
- 현재 환경에서는 npm registry 접근이 timeout되어 local Vite production build는 재실행하지 못했습니다.
- Vercel 배포 후 30 FPS MP4 metadata와 Preview/Render 시각 일치를 최종 확인합니다.
