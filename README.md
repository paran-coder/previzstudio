# Previz Studio v1.2.1

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다. 자연어는 초기 블로킹 입력 수단이며, 제품의 핵심 결과물은 **인물 동작 + 카메라 앵글/무빙 + 렌더된 프리비즈 레퍼런스**입니다.

## v1.2.1 핵심 패치

### Camera Preview = Export
- `편집 뷰`: 공간 확인용 자유 director camera
- `카메라 프리뷰`: 최종 영상과 동일한 shot camera
- Preview와 Export는 동일한 master-time `evaluateCameraAtTime()`을 사용합니다.
- shot cut도 20초 master timeline의 동일한 boundary를 사용합니다.

### Blocking-derived camera
공식 추격 장면의 카메라는 arbitrary world coordinate가 아니라 actor blocking과 진행 방향을 기준으로 계산됩니다.

1. Rear 3/4 Wide — 24mm
2. Side Tracking — 35mm
3. Rear Handheld Follow — 50mm
4. Between Tracking Push — 35mm

### UI hierarchy overhaul
제공된 UI polish 원칙과 dark surface token reference를 참고해 다음을 적용했습니다.

- 5단계 dark surface hierarchy
- panel/title/body/metadata typography 분리
- timeline clip 10px 이상
- current shot title 13px
- panel title 12px
- accent color 역할 제한
- 편집/프리뷰 상태에 따른 primary CTA 전환

## 기본 출력
- 1920 × 1080
- 24fps
- 20초 공식 demo
- MP4 우선 / 브라우저 호환 fallback
- shot start/mid/end PNG
- Scene JSON / Reference Manifest JSON

## 실행
```bash
npm start
```
브라우저에서 `http://127.0.0.1:4173`을 엽니다.

Three.js를 강제로 우회해 Canvas validation renderer를 사용하려면:
```text
http://127.0.0.1:4173/?renderer=canvas
```

## 테스트
```bash
npm run check
npm test
```

현재 자동 검증: **14/14 PASS**.

## 배포 후 확인할 항목
작업 컨테이너에서는 headless Chromium graphics initialization이 동작하지 않아 production Three.js visual smoke test는 배포 후 확인해야 합니다. 특히 다음을 확인하십시오.

1. 카메라 프리뷰 0s / 4s / 9s / 14s cut
2. 다운로드한 20초 MP4의 같은 시점 구도
3. 패널 surface separation과 한글 text hierarchy
