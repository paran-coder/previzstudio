# Previz Studio-v1.5.0 Context Notes

목적: Blender 프리비즈 제작의 수작업을 줄이고 영상 생성용 공간·동선·카메라 레퍼런스를 만든다.

2026-10-04 승인: 공간/인물/동선/카메라 및 편집·출력의 네 범위, 문서와 GitHub 패키지 갱신. 사용자 추가 결정: 구조화된 선택 입력을 기본으로 하고 AI 문장 분석은 후속으로 미룬다. API/키 설정은 추가하지 않는다.

v1.4.0 업로드본을 보존하고 별도 v1.5.0에서 구현했다. 생성된 구성은 기존 scene schema 및 renderer/exporter로 전달한다. 환경 분위기는 supplementaryPrompt로 저장하고 단순 daylight 구조물을 사용한다.

신규 핵심: createBlockingScene, editActionPath. 이동/대기 구간 연결과 잘못된 좌표/시간 차단. 우산과 입구 구조물 자체 구현. 기존 규칙 입력·나이프·추격·출력 경로 보존. video-exporter.js 그대로 유지.

참고: ShowMotion 용어 탐색, Motion Index/CMU 모션 데이터 구조와 제한을 조사했다. 사이트 코드/설명/데이터를 복제하지 않았고 CMU 클립을 포함하지 않았다.

검증 상세는 작업 폴더의 2026-10-04-previz-studio-v1.5.0-delivery.md에 기록한다. GitHub push와 실배포는 사용자가 수행한다.
