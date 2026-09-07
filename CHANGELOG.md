# Changelog

## v1.2.2 — 2026-09-07

### Fixed
- Camera Preview now uses the canonical project output aspect instead of inheriting the UI viewport ratio.
- 1920×1080 projects display as a centered 16:9 output stage with letterbox/pillarbox space when required.
- Shot Camera aspect is isolated from Edit View resize behavior.
- PNG capture now uses the same canonical output buffer path as video export.
- Export restore returns to the correct Edit/Preview canvas sizing.
- Initial Edit View camera now derives a three-quarter elevated overview from actor blocking and early travel bounds instead of fixed orbit values.

### UI
- Increased dark-surface separation for workspace, side panels, timeline, and elevated cards.
- Increased Korean UI typography scale for panel titles, inspector, timeline, buttons, and metadata.
- Camera Preview status explicitly identifies the 16:9 output frame.

### Verification
- Syntax checks pass.
- Automated tests: 18/18 PASS.
- Added output-stage aspect and initial edit-overview regression tests.
- Container Chromium visual capture remains unavailable; production visual comparison is required after deployment.

## v1.2.1 — 2026-09-07

### Camera consistency
- `렌더 뷰`를 `카메라 프리뷰`로 재정의했습니다.
- 카메라 프리뷰와 영상 Export가 동일한 `evaluateCameraAtTime()` / `applyTime()` 경로를 사용하도록 고정했습니다.
- 20초 master timeline의 shot cut boundary를 동일 evaluator가 처리합니다.
- 공식 추격 장면의 카메라를 임의 world 좌표 대신 배우 blocking과 진행 방향 기준 local offset으로 계산합니다.
- Shot 01을 낮은 rear 3/4 wide로 변경했습니다.
- Shot 02는 side track, Shot 03은 rear follow, Shot 04는 between push archetype을 사용합니다.
- 편집용 director camera도 초기 배우 위치를 기준으로 프레이밍합니다.
- 카메라 프리뷰에서 컷 직후 shot / lens / camera archetype overlay를 표시합니다.

### UI polish
- 제공된 `ui-polish` 원칙과 Lamborghini-inspired design token의 surface-layering 개념을 참고해 UI를 재구성했습니다.
- 배경 / workspace / panel / elevated / interactive의 5단계 dark surface hierarchy를 도입했습니다.
- depth를 heavy shadow 대신 surface 밝기 차이와 1px border 중심으로 표현합니다.
- core Korean UI typography를 10–15px 계층으로 재설계했습니다.
- 한글 section label의 과도한 uppercase-style letter spacing을 제거했습니다.
- viewport current shot, timeline, inspector 순으로 시각적 우선순위를 재조정했습니다.
- lime은 primary/current, cyan은 actor/action, purple은 camera 의미로 제한했습니다.
- 편집 뷰에서는 `장면 만들기`, 카메라 프리뷰에서는 `프리비즈 영상 렌더`만 primary accent가 되도록 CTA hierarchy를 수정했습니다.

### Verification
- JavaScript syntax check: PASS
- Automated tests: 14/14 PASS
- 480-frame / 24fps camera transform finite check: PASS
- Shot boundary 4.000s cut regression: PASS
- Preview/export shared evaluator contract: PASS
- UI surface/token contract: PASS
- Static 1710×910 UI hierarchy review generated

### Environment note
- 현재 작업 컨테이너의 headless Chromium graphics 초기화 문제로 실제 Chromium runtime screenshot은 생성하지 못했습니다. Production/Vercel에서의 Three.js visual smoke test는 배포 후 확인 대상입니다.

## v1.2.0 — 2026-09-07

- 20초 master sequence와 actor/camera animation 도입
- 1920×1080 / 24fps browser video export 도입
- 편집/출력 view 분리의 첫 버전
- 공식 밤의 도로 추격 demo 추가
- OG image / social metadata 추가
