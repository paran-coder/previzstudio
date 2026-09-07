# Previz Studio v1.0.0 — User Manual

## Start the Prototype

From the project folder:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in a modern browser.

## Basic Workflow

1. Enter a scene description in the bottom prompt bar.
2. Select **Generate Scene** or press `Ctrl/Cmd + Enter`.
3. Inspect actors, environment, camera, and lights in the viewport.
4. Use **Director** view to orbit around the scene; drag to rotate and use the wheel to zoom.
5. Use **Shot Camera** to see the actual camera framing.
6. Adjust lens, duration, and dolly distance in the Inspector.
7. Press Play or scrub the timeline to review the move.
8. Export Start / Mid / End PNG reference frames.
9. Export Scene JSON for reproducibility.
10. Export **Manifest JSON** to pass camera, continuity, actor, and reference-frame intent into an AI-video workflow.

## Default Demo

> 밤의 창고. 두 사람이 서로 마주 서 있고 카메라가 두 사람 사이로 천천히 이동한다.

Expected result:

- Warehouse / Night
- Two actors
- 35mm lens
- Dolly-through camera move
- 6 second duration

## Natural-Language Examples

```text
비 오는 골목, 두 명을 85mm로 4초 동안 따라간다.
```

```text
와이드 24mm. 세 사람이 창고에 서 있고 카메라는 고정한다.
```

```text
사무실에서 한 사람을 50mm로 천천히 따라간다.
```

The v1.0.0 prototype uses a deterministic local language parser. A server AI Director is the planned production replacement, while keeping the same Scene Document contract.

## Editor Areas

- **Scene** — environment, actors, camera, and lights.
- **Viewport** — 3D previz and director navigation.
- **Inspector** — lens, duration, camera distance, and reference exports.
- **Shots** — current shot and transport timeline.
- **Prompt Bar** — natural-language directing input.

## Reference Outputs

- `previz-shot01-start.png`
- `previz-shot01-mid.png`
- `previz-shot01-end.png`
- `previz-scene-v1.0.0.json`
- `previz-reference-pack-manifest.json`

The manifest preserves source prompt, continuity key, actors, lens, camera path, timing, and recommended frame roles.
