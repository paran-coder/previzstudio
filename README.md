# Previz Studio v1.1.0

영화·광고 제작자와 AI 영상 크리에이터를 위한 웹 기반 3D 프리비즈 프로토타입입니다.

자연어 장면 설명을 **Scene Document → 멀티샷 연출 → 3D 프리비즈 → AI 영상 레퍼런스**로 변환합니다.

## v1.1.0 핵심 기능

- 실제 LLM AI Director 서버 경로
  - OpenAI Responses API
  - Structured Outputs JSON Schema
  - API 키는 브라우저에 노출하지 않고 서버에서만 사용
- API 키가 없거나 호출이 실패할 때 로컬 Director 자동 fallback
- 멀티샷 자동 연출
  - 기본 대치 장면: 공간 설정 → 인물 A → 인물 B → 대치 돌리
- Three.js 렌더러 경로
  - Three.js r185.1 고정
  - `WebGPURenderer` 사용, 지원되지 않는 환경은 Three.js 내부 WebGL 2 fallback
- GLB/glTF Asset Resolver
  - `actor-neutral.glb`
  - `sedan-blockout.glb`
  - `warehouse-blockout.glb`
- Three.js CDN 로드가 불가능한 환경에서는 Canvas 3D renderer fallback
- 한국어 중심 UI
- 샷별 렌즈 / 길이 / 이동거리 편집
- Director View / Shot Camera View
- 시작 / 중간 / 끝 PNG 레퍼런스
- Scene JSON / AI Reference Manifest JSON 내보내기
- 배우 ID 및 공간 continuity 유지

## 실행

Node.js 20 이상이 필요합니다. 별도 npm 패키지 설치는 필요하지 않습니다.

```bash
cd previz-studio-v1.1.0
npm start
```

브라우저에서 다음 주소를 엽니다.

```text
http://127.0.0.1:4173
```

## 실제 AI Director 연결

프로젝트 루트에서 환경 파일을 만듭니다.

```bash
cp .env.example .env
```

`.env`에 서버용 API 키를 설정합니다.

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-6-astra
PORT=4173
```

`.env` 파일은 정적 파일 서버에서 제공되지 않습니다.

API 키가 없으면 UI는 자동으로 **로컬 대체 Director**를 사용하므로 기본 프리비즈 기능은 그대로 동작합니다.

## 렌더러

정상적인 네트워크 환경에서는 import map을 통해 Three.js r185.1을 로드합니다. `GLTFLoader`가 프로젝트 내부 GLB 파일을 읽어 실제 3D asset pipeline을 사용합니다.

Three.js CDN이 로드되지 않는 환경에서는 dependency-free Canvas renderer로 자동 전환됩니다. 이 fallback은 UI와 샷 연출을 계속 검증하기 위한 것이며, production 경로는 Three.js입니다.

## 테스트

```bash
npm run check
npm test
```

v1.1.0 검증 결과:

- JavaScript syntax check: PASS
- Unit / contract tests: 6 PASS / 0 FAIL
- Browser smoke test: PASS
- Browser page errors: 0
- Default 4-shot generation: PASS
- Shot selection/editing: PASS
- Natural language fallback regeneration: PASS
- GLB static delivery: PASS
- `.env` static exposure block: PASS

실제 외부 OpenAI 호출은 개인 API 키가 필요한 관계로 포함된 contract test에서 request schema와 response parsing을 검증합니다.

## 프로젝트 구조

```text
previz-studio-v1.1.0/
├── context-notes.md
├── checklist.md
├── README.md
├── User manual.md
├── CHANGELOG.md
├── .env.example
├── package.json
├── server.mjs
├── index.html
├── styles.css
├── preview.png
├── assets/
│   └── models/
│       ├── actor-neutral.glb
│       ├── sedan-blockout.glb
│       └── warehouse-blockout.glb
├── src/
│   ├── app.js
│   ├── scene-schema.js
│   ├── director-client.js
│   ├── director-fallback.js
│   ├── asset-catalog.js
│   ├── renderer-three.js
│   └── renderer-canvas.js
└── tests/
    ├── director.test.mjs
    ├── schema.test.mjs
    └── server.test.mjs
```

## 설계 원칙

AI는 Three.js 코드를 생성하지 않습니다. AI Director는 제한된 Scene JSON만 생성하고 렌더러가 이를 결정론적으로 해석합니다. 이 구조가 continuity, 수정 가능성, export 안정성을 확보합니다.

## 다음 버전 권장 순서

**v1.2.0: 캐릭터 애니메이션 + 액션 시퀀싱**을 권장합니다.

멀티샷 구조가 먼저 완성되었기 때문에 다음에는 `walk`, `turn`, `sit`, `open_door`, `exit_vehicle` 같은 animation clip을 Action Sequence로 연결하는 것이 가장 효과적입니다.
