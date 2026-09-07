# Previz Studio v1.3.0

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다.

## v1.3.0 핵심

- 결정론적 자연어 블로킹
  - 배우 수 (`한 사람`, `두 사람`)
  - `격투`, `싸움`, `추격`, `달리기`, `걷기`
  - `다양한 각도`, `역동적`, `익사이팅`, `핸드헬드` 카메라 힌트
- `FIGHT` 액션과 2인 격투 기본 시퀀스
- Camera Editing
  - 위치 X/Y/Z
  - 높이
  - 피사체 거리
  - 타겟
  - Start / End transform
- Three.js Transform Gizmo
  - Camera 이동 / 회전 / 타겟
  - Actor 이동 / 회전
- 사용자 카메라 수정을 manual override로 보존
- Camera Preview / PNG / Video Export Canonical Frame 유지
- Vite production build + hashed assets

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

## 프롬프트 예시

```text
두 사람이 격렬하게 하는 격투씬, 카메라가 다양한 각도로 익사이팅한 앵글로 따라간다.
```

예상 결과는 Actor 2명, FIGHT action, 20초 멀티샷 카메라입니다.

## 카메라 편집

현재 Shot에서 `카메라`를 선택한 뒤 시작/끝 키를 선택하고 위치, 높이, 거리, 타겟을 수정할 수 있습니다. 편집 뷰의 Transform Gizmo 또는 Inspector 숫자 입력을 사용할 수 있습니다.

사용자가 수동으로 수정한 Shot은 manual override 상태가 되며 `자동 구도로 되돌리기`를 누르기 전까지 자동 연출 계산보다 우선합니다.

## 출력

Camera Preview와 PNG/MP4/WebM 출력은 동일한 Canonical Frame 경로를 사용합니다.

## 현재 검증 상태

자동 테스트는 **29/29 PASS**입니다. 현재 실행 환경에는 npm dependency cache가 없어 실제 Vite production build를 로컬에서 재실행하지 못했습니다. `package.json`은 exact version으로 고정되어 있으며 Vercel 배포 시 `npm install → vite build`로 검증합니다.

Three.js가 정상 로드되는 production renderer에서는 Transform Gizmo를 사용할 수 있습니다. Canvas fallback에서는 Inspector 숫자 입력으로 동일한 Scene Document를 수정할 수 있지만 3D TransformControls 자체는 표시하지 않습니다.
