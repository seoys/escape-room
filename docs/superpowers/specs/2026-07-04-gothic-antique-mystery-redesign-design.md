# 고딕 앤틱 미스터리 리디자인

## 배경

현재 방탈출 게임 UI는 "해커 터미널 / 스파이 요원" 컨셉(CRT 플리커, 초록 터미널 텍스트, `AGENT_ID`, `CLASSIFIED` 도장, 마우스 추적 플래시라이트, hex 디코이 텍스트)이다. 사용자는 방탈출 카페에 더 어울리는 "클래식 미스터리/앤틱, 고딕 다크 톤, 세리프 위주" 분위기로 전면 교체를 원한다.

## 목표

- 색상, 타이포그래피, 장식 효과, 카피(용어)를 전부 고딕 앤틱 미스터리 톤으로 통일
- 대상 화면: 홈(`/`), start(`/start`), escape(`/escape/[roomId]`), finish(`/finish`)
- 게임 로직/상태관리(`gameStore`, `redisClient`, 라우팅, 점수 계산 등)는 변경하지 않음. UI/스타일/카피만 교체.

## 비목표

- 새 기능 추가, 퍼즐 데이터 변경, 상태관리 리팩터링
- 반응형/접근성 구조 자체의 재설계 (기존 레이아웃 구조는 유지하되 톤만 교체)

## 디자인

### 1. 색상 팔레트 (`globals.css`)

CSS 커스텀 프로퍼티를 아래 값으로 교체:

- `--color-bg`: `#0d0b12` (짙은 남색-검정)
- `--color-brass` (신규, 기존 `--color-terminal-green` 대체): `#c9a24b` — 놋쇠 금색, 메인 포인트
- `--color-brass-dim`: `rgba(201, 162, 75, 0.15)`
- `--color-panel-bg`: `rgba(10, 8, 14, 0.85)`
- `--color-candle-amber` (기존 `--color-warn-amber` 역할 계승): `#e8965a`
- `--color-candle-amber-dim`: `rgba(232, 150, 90, 0.15)`
- `--color-wine-red` (기존 `--color-danger-red` 대체): `#7a1f2b`
- `--font-serif` (기존 `--font-sans` 대체): `'Noto Serif KR', 'Playfair Display', serif`
- `--font-serif-mono` 역할은 별도 유지하지 않고 본문도 세리프 계열(`--font-serif`)로 통일. 기존 `--font-mono`(JetBrains Mono) 완전 제거.

Google Fonts import를 `Noto Serif KR` + `Playfair Display`로 교체.

### 2. 효과 재정의

- `.crt-effect`, `.scanline-overlay`, `.flashlight-bg`(마우스 추적), `scanline-roll` 애니메이션, 디코이 hex 텍스트 로직 → 전부 제거
- 신규 `.vignette-bg`: 고정 위치 방사형 그림자(화면 중앙은 밝고 가장자리는 어두운 정적 비네트), 마우스 이벤트 리스너 없음
- 신규 `.candle-flicker`: 아주 은은한 밝기 변화 애니메이션(옵션, 텍스트 강조용 정도로 축소 적용 — 화면 전체 플리커는 아님)
- `.terminal-panel` → `.antique-panel`로 개명 및 스타일 교체: 반투명 검정 배경 + 금색 1px 테두리 + 은은한 금색 글로우
- `.corner-decor` 테두리 색상을 금색으로 변경 (구조는 유지)
- `.terminal-input` → `.antique-input`: 금색 테두리, 세리프 폰트, placeholder는 옅은 금색
- `.btn-terminal` → `.btn-antique` (기본/금색), `.btn-terminal-warn` → `.btn-antique-warn`(와인레드 계열)로 개명 및 색상 교체
- `.dossier-stamp` 유지하되 색상을 와인레드 계열로 통일 (이미 danger-red 사용 중이므로 변수만 교체)
- `.hud-progress-fill`, `.custom-scrollbar` 등 초록색 참조를 금색으로 교체

### 3. 카피(용어) 전환

해커/보안 용어 → 저택/미스터리 용어로 전면 교체. 예시 매핑(각 파일에서 실제 문맥에 맞게 적용):

| 기존 | 변경 |
|---|---|
| AGENT_IDENTIFIER_CODE / 에이전트 | 방문객 성함 |
| CLASSIFIED / DOSSIER | 봉인된 기록 / 저택의 문서 |
| SYSTEM TERMINAL ACCESS | 저택의 서재 |
| LAUNCH OPERATION / 작전 개시 | 저택으로 들어가기 |
| DECRYPTING... | 열쇠를 맞춰보는 중... |
| ACCESS DENIED: PASSCODE REJECTED | 열쇠가 맞지 않습니다 |
| SUCCESS: ROOM OVERPASS | 문이 열렸습니다 |
| DECRYPT_KEY / 힌트 라벨 | 단서 |
| SECTOR | 방 번호 |
| DATA_PTS | 점수 |
| GIVE_UP 확인 문구("작전을 철수하고...") | "탐사를 포기하고 저택을 나가시겠습니까?" |
| EXECUTE_OVERPASS_CMD | 문 열기 |
| Establishing Security Link... (로딩) | 다음 방으로 이동하는 중... |

세부 문구는 구현 단계에서 각 파일을 보며 자연스럽게 다듬는다(표는 방향성 참고용).

### 4. 페이지별 적용

**`layout.tsx`**: `Noto_Sans_KR` → `Noto_Serif_KR`로 폰트 교체.

**`page.tsx`(홈)**: 열쇠 드래그 인터랙션 로직은 그대로 유지. 배경(`main-background` 클래스, globals.css에 정의됨 — 확인 필요)과 안내 문구 톤만 앤틱하게(예: "열쇠를 잡고 자물쇠에 꽂아보세요"). 모달 버튼 색상을 인디고 → 금색 계열로.

**`start/page.tsx`**: 좌측 "기밀 조사 문서" 패널 → "저택 방문 기록부" 컨셉으로. 우측 터미널 폼 → "서재 접수대" 톤. 시스템 로그 타이핑 효과는 촛불이 켜지는 듯한 문구로 대체(예: "촛불을 밝히는 중...", "오래된 문을 여는 중...`). 성별/연령 선택 UI 구조는 유지, 라벨과 색상만 교체.

**`escape/[roomId]/RoomClient.tsx`**: HUD 라벨, 문제 패널 헤더("INCOMING ENCRYPTED QUESTION DOSSIER" 등), 토스트 메시지, 힌트 모달 문구, 버튼 라벨 전부 교체. 배경 플래시라이트/스캔라인/디코이패스코드 로직(`useEffect`)은 제거. `ParticleBackground` 컴포넌트는 존재 시 색상 프롭만 확인해 톤에 맞게 조정(파일 내용 확인 필요, 없으면 스킵).

**`finish/page.tsx`**: 현재 오렌지/화이트 축하 톤 → 고딕 앤틱 팔레트로 전환. 이모지(🎉🏆🥇 등)는 유지 여부 구현 시 판단(과도하게 밝은 이모지는 톤과 안 맞을 수 있어 축소 검토). 배경 이미지(`finish_background.png`)는 그대로 사용하되 오버레이로 톤 보정.

### 5. 검증

- `pnpm build`, `pnpm lint` 통과
- `pnpm dev`로 홈 → start → escape/1 → (가능하면 몇 방 진행) → finish 플로우를 브라우저에서 육안 확인
- 기존 상태관리/로컬스토리지 키, 라우팅 동작에 회귀 없는지 확인 (스타일/카피만 바꾸므로 로직 diff 최소화)

## 리스크 / 참고

- `ComboLockInput`, `SpeedrunTimer`, `ParticleBackground` 등 하위 컴포넌트가 자체적으로 초록/터미널 색상을 하드코딩하고 있을 가능성 있음 — 구현 시 개별 확인 필요
- 현재 uncommitted 상태인 `RoomClient.tsx`, `globals.css`, `start/page.tsx` 변경사항 위에 이번 리디자인이 얹어짐. 기존 uncommitted 변경의 기능적 의도(나이/성별, 점수 시스템 등)는 유지한 채 스타일만 교체.
