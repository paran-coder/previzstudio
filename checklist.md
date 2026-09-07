# Previz Studio v1.2.0 — Checklist

## Phase 0 — Project setup
- [x] `context-notes.md` updated for v1.2.0
- [x] `checklist.md` updated for v1.2.0
- [x] `README.md` updated for v1.2.0
- [x] `User manual.md` updated for v1.2.0
- [x] version metadata bumped to 1.2.0
- [x] 1200×630 OG image + social metadata included

## Phase 1 — Sequence architecture
- [x] master 20-second timeline
- [x] shot start/end times
- [x] sequence-time -> active-shot resolver
- [x] actor action tracks
- [x] camera track evaluation
- [x] deterministic natural-language command extraction

## Phase 2 — Character animation
- [x] consistent neutral mannequin
- [x] `idle`
- [x] `walk`
- [x] `run`
- [x] `chase`
- [x] `turn`
- [x] `stop`
- [x] root-motion evaluation
- [x] procedural limb animation

## Phase 3 — Camera animation
- [x] `static`
- [x] `dolly_in`
- [x] `dolly_out`
- [x] `track_follow`
- [x] `track_between`
- [x] `orbit`
- [x] `handheld_follow`
- [x] per-shot lens evaluation

## Phase 4 — UI
- [x] 편집 뷰 / 렌더 뷰
- [x] 20-second master timeline
- [x] shot blocks
- [x] actor action tracks
- [x] camera track
- [x] current sequence time readout
- [x] render settings panel
- [x] Korean-first primary UI
- [x] reduced-motion support

## Phase 5 — Rendering / export
- [x] shot-camera render path
- [x] 1920×1080 render target
- [x] 24 fps frame evaluation
- [x] MP4-capable WebCodecs/Mediabunny path
- [x] MediaRecorder MP4/WebM fallback
- [x] download generated video
- [x] per-shot start/mid/end PNG
- [x] Scene JSON
- [x] Reference Manifest JSON

## Phase 6 — Official demo
- [x] night road environment
- [x] actor 01 runs away
- [x] actor 02 chases actor 01
- [x] four-shot 20-second sequence
- [x] wide -> side tracking -> handheld follow -> between/push
- [x] playback end-to-end
- [x] export end-to-end

## Phase 7 — Verification
- [x] JavaScript syntax check
- [x] unit tests 8/8
- [x] actor root-motion tests
- [x] camera motion tests
- [x] browser smoke test
- [x] page errors = 0
- [x] official demo visual check
- [x] actual 20-second video file generated
- [x] ffprobe: H.264 / 1920×1080 / ~19.99 sec / ~24 fps

## Result
**v1.2.0 Definition of Done satisfied.**

두 캐릭터와 카메라가 20초 추격 시퀀스에서 실제로 움직이고, Shot Camera 결과가 재생 가능한 1920×1080 H.264 MP4 파일로 출력되는 것을 검증했습니다.
