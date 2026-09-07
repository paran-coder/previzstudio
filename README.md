# Previz Studio v1.2.3

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 도구입니다.

v1.2.3은 새 기능을 추가하지 않고 **카메라 프리뷰 / PNG / 영상 출력의 단일 프레임 파이프라인**과 **Vite 기반 배포 무결성**을 완성하는 안정화 버전입니다.

## 핵심 변경 목표

### 1. Canonical Frame
같은 마스터 시간의 Shot Camera는 한 번의 공통 경로로 계산·렌더됩니다.

```text
Scene + Master Time
        ↓
Actor / Camera evaluation
        ↓
Canonical Output Frame (기본 16:9)
        ↓
Preview / PNG / MP4 / WebM
```

UI 패널의 가로세로 비율은 Shot Camera의 aspect/FOV를 변경하지 않습니다. 출력 해상도가 달라져도 구도는 동일해야 합니다.

### 2. Vite + hashed assets
- Three.js를 npm dependency로 번들링
- runtime CDN import map 제거
- `npm run build` → `dist/`
- Production JS/CSS content hash 적용
- HTML과 오래된 renderer 모듈이 섞이는 캐시 문제 방지
- runtime build ID로 v1.2.3 구성요소 일치 확인

## 공식 검증 장면

20초 야간 도로 추격 장면, `1920×1080 / 24 FPS`.

1. 0–4초 — 후방 3/4 와이드
2. 4–9초 — 측면 트래킹
3. 9–14초 — 추격자 후방 핸드헬드
4. 14–20초 — 두 인물 사이 트래킹/푸시

## 개발 실행

의존성 설치 후:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

기존 간단한 Node 정적 서버는 fallback/debug 용도로만 유지할 수 있으며, Production 기준은 Vite `dist/`입니다.

## 검증

```bash
npm run check
npm test
```

자동 검증은 **22/22 PASS**입니다. 현재 작업 컨테이너는 npm registry 접근이 차단되어 실제 Vite dependency install/build는 수행하지 못했습니다. GitHub/Vercel 배포에서 `npm install → npm run build`를 확인한 뒤 Camera Preview와 렌더 영상을 `0.5 / 4.5 / 9.5 / 14.5 / 19.0초`에서 다시 비교합니다. 이 검증이 통과한 뒤 UI 최종 polish 단계로 이동합니다.
