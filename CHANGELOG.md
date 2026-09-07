# Changelog

## v1.2.0 — 2026-09-07

### 핵심 방향 변경
- 제품 중심을 자연어 해석에서 **실제 프리비즈 동작과 영상 렌더링**으로 이동했습니다.
- 외부 LLM은 필수 경로에서 제거하고, 지원 가능한 명령만 추출하는 로컬 Previz Director를 기본으로 사용합니다.

### 추가
- 20초 마스터 시퀀스 / 24 FPS 타임라인
- 공식 `밤의 도로 추격` 4샷 데모
- 배우 액션 트랙: Idle / Walk / Run / Chase / Turn / Stop
- 실제 root motion 기반 배우 이동
- 프로시저럴 프리비즈 마네킹과 달리기/걷기 limb swing
- 카메라: Static / Dolly In / Dolly Out / Track Follow / Track Between / Orbit / Handheld Follow
- 편집 뷰 / 렌더 뷰 분리
- 1920×1080 영상 렌더 파이프라인
- WebCodecs + Mediabunny MP4 우선 경로
- MediaRecorder MP4/WebM fallback
- 1200×630 `og.png`
- Open Graph / X(Twitter) large-image 메타태그
- 마스터 타임라인의 Shot / Actor / Camera tracks

### 변경
- `actor-neutral.glb` 외형에 의존하지 않고 렌더러 내부의 일관된 중립 마네킹을 기본 표시로 사용합니다.
- 자연어 입력은 심층 의미 분석 대신 장소, 시간, 동작, 추격 관계, 카메라, 렌즈를 지원 범위에서만 추출합니다.
- 기본 Node 엔진 요구 버전을 22 이상으로 변경했습니다.
- AI Director 상태 UI를 `프리비즈 디렉터 · 로컬`로 변경했습니다.

### 검증
- JavaScript syntax check PASS
- Unit tests 8/8 PASS
- Canvas browser smoke test PASS
- 브라우저 page errors 0
- 20초 재생 / 샷 자동 전환 PASS
- 자연어 복도/50mm/달리기/트래킹 재생성 PASS
- 영상 파일 실제 생성 PASS
- 검증 영상: H.264 MP4, 1920×1080, 약 19.99초, 약 24fps
