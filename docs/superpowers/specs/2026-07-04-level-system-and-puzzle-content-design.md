# 나이 기반 레벨 시스템 전환 + 퍼즐 콘텐츠 전면 재작성

## 배경

기존 시스템은 나이를 `teen(~19)/adult(20~39)/senior(40+)` 3단계 `AgeGroup`으로 나누고, 각 그룹에 방 1~30/31~60/61~90을 배정했다. 그러나 시니어(40+) 세트는 서사 없이 지나치게 쉬운 산수 위주였고, 사용자가 실제로 원하는 타겟(10대~40대)과 "쉬운 시니어 티어"라는 프레이밍이 맞지 않았다. 사용자는 나이를 **난이도 레벨 선택 기준**으로 명확히 재정의하고, 문항 유형도 연산 위주에서 벗어나 다양화하길 원한다.

## 목표

1. `AgeGroup`('teen'/'adult'/'senior') 개념을 `Level`(1|2|3|4)로 전면 교체. 10대=1, 20대=2, 30대=3, 40대 이상(50+ 포함 캡핑)=4.
2. 레벨별 문항 난이도를 학년 기준으로 재보정: 레벨1=초등 고학년, 레벨2=중1, 레벨3=중2, 레벨4=중3(중등 고학년).
3. 문항 유형을 다양화: 연산 위주에서 벗어나 관찰/시각, 암호/치환, 추리(논리 추론), 타일 순서 배열형, 넌센스를 골고루 배치.
4. 새로운 "타일 순서 배열" 입력 방식을 위한 최소한의 신규 UI 컴포넌트를 추가.
5. 문항 지문/제목을 기존에 완료한 "고딕 앤틱 미스터리(저택)" UI 테마와 서사적으로 통일.

## 비목표

- 드래그 앤 드롭 등 복잡한 인터랙션 UI (탭 방식으로 충분)
- 기존 100문항의 부분 재사용 (전면 재작성, 기존 문항 폐기)
- 점수/콤보/힌트 페널티 등 게임 로직 변경 (그대로 유지)
- 리더보드/세션 저장 형식의 근본적 변경 (필드명만 `ageGroup`→`level`로 교체)

## 설계

### 1. 레벨 타입 전환

**`src/types/room.ts`**
- `AgeGroup` 타입을 삭제하고 `Level = 1 | 2 | 3 | 4`로 교체
- `Room.inputType`에 `'tile-order'` 추가
- `Room`에 `tiles?: string[]` 필드 추가 (정답 순서대로 저장된 타일 목록. 화면에는 셔플되어 표시되고, 플레이어가 탭한 순서를 이어붙인 문자열이 `answer`와 일치하는지 비교)

**`src/types/session.ts`**
- `StoredSession.ageGroup?: 'teen' | 'adult' | 'senior'` → `level?: 1 | 2 | 3 | 4`

**`src/lib/age-group.ts`** (파일명은 유지, 내부 함수만 교체)
- `getAgeGroupFromAge(age)` → `getLevelFromAge(age): Level`
  - `age <= 19` → `1`
  - `age <= 29` → `2`
  - `age <= 39` → `3`
  - 그 외(40 이상) → `4`
- `normalizeAgeGroup(value)` → `normalizeLevel(value): Level` (유효하지 않은 값은 기본값 `2`로 폴백 — 기존 `'adult'` 기본값과 동일한 포지션)

**`src/lib/room-selector.ts`**
- `getRoomsForAgeGroup(ageGroup)` → `getRoomsForLevel(level: Level): Room[]`
  - level 1 → id 1~30
  - level 2 → id 31~60
  - level 3 → id 61~90
  - level 4 → id 91~120
- `AGE_GROUP_COOKIE_KEY` → `LEVEL_COOKIE_KEY` (쿠키 값은 `'1'|'2'|'3'|'4'` 문자열로 저장)

**`src/app/actions/game.ts`**
- `verifyAnswer(roomId, answer, ageGroup: AgeGroup = 'adult')` → `verifyAnswer(roomId, answer, level: Level = 2)`
- 내부적으로 `getRoomsForLevel` 호출, `tile-order` 타입 문항의 정답 비교 로직도 기존 정규화(공백 제거, 소문자화) 그대로 적용 (타일 순서 답은 이미 이어붙인 문자열 형태로 전달되므로 별도 분기 불필요)

**`src/app/escape/[roomId]/page.tsx`**
- 쿠키에서 `normalizeLevel` 사용, `getRoomsForLevel` 호출, `RoomClient`에 `level` prop 전달

**`src/app/start/page.tsx`**
- `AGE_GROUP_LABELS` → `LEVEL_LABELS` (레벨1~4 라벨/설명 문구를 학년 기준으로 재작성, 예: "레벨 1 · 초등 고학년" 등 — 정확한 문구는 구현 시 저택 테마에 맞게 다듬음)
- 나이 입력 시 `getLevelFromAge`로 레벨을 계산해 배지로 표시 (기존 `ageGroupInfo` 배지와 동일한 위치/스타일)
- `localStorage`/쿠키 저장 키를 `playerAgeGroup`→`playerLevel`, `player_age_group`→`player_level`로 변경

**`src/app/escape/[roomId]/RoomClient.tsx`**
- `RoomClientProps.ageGroup: AgeGroup` → `level: Level`
- `writeSession` payload의 `ageGroup` → `level`
- `room.inputType === 'tile-order'`일 때 새 `TileOrderInput` 컴포넌트 렌더링 (아래 2번 참고)

**`src/app/finish/page.tsx`**
- 리더보드에 표시되던 `user.ageGroup` → `user.level` (표시 문구도 "1레벨" 식으로 변경)

### 2. 신규 컴포넌트: `TileOrderInput`

**파일**: `src/components/TileOrderInput.tsx`

- Props: `tiles: string[]`(정답 순서로 정렬된 원본 배열), `value: string`(현재까지 탭한 순서를 이어붙인 문자열), `onChange: (val: string) => void`, `disabled?: boolean`
- 컴포넌트 마운트 시 `tiles`를 셔플한 배열을 내부 상태로 만들어 표시 (매 마운트마다 새로 셔플 — `useState(() => shuffle(tiles))` 형태, `room.tiles`가 바뀌면(id 변경 시) 다시 셔플)
- 각 타일은 버튼으로 렌더링, 탭하면 "선택된 타일" 목록 뒤에 추가되고 해당 타일 버튼은 비활성화(이미 선택됨 표시)
- 선택된 순서를 이어붙인 문자열을 `onChange`로 상위에 전달 (RoomClient의 `answer` state와 동일한 방식으로 연결)
- "다시 섞기" 또는 "선택 취소(마지막 선택 되돌리기)" 버튼 하나 포함 (플레이어가 실수했을 때 초기화 가능하도록) — 이 버튼은 게임 로직(힌트/점수)에 영향 없음, 순수 UI 상태 리셋
- 스타일은 기존 고딕 앤틱 테마의 `.antique-input`/`.btn-antique` 팔레트를 재사용 (새 CSS 클래스 추가는 최소화하고 기존 클래스 조합으로 구성)

**RoomClient.tsx 연동**: `ComboLockInput`과 동일한 위치(폼 내부)에 조건부 렌더링 추가, `disabled={isSubmitting}` 전달.

### 3. 문항 콘텐츠 재작성 (`src/lib/rooms-data.ts`, 120문항)

- id 1~30(레벨1) / 31~60(레벨2) / 61~90(레벨3) / 91~120(레벨4)
- 각 레벨(30문항) 내 유형 분포 가이드라인 (엄격한 개수 규칙이 아니라 균형 기준):
  - 연산/수식: 6~8개
  - 관찰/시각(반전, 숨은 패턴 등): 4~5개
  - 암호/치환(모스, 시저, 진법 등 — 레벨에 맞게 난이도 조절): 4~5개
  - **추리(논리 추론, 다단서 종합)**: 4~5개, 레벨이 올라갈수록 단서/용의자 수 증가
  - **타일 순서 배열형(`tile-order`)**: 4~6개
  - 넌센스/사고전환: 3~4개
  - 도형/기하: 3~4개
- 난이도 보정 기준(대략):
  - 레벨1(초등 고학년): 한 자릿수~두 자릿수 사칙연산, 단순 규칙 찾기, 직관적 암호(알파벳 순서 이동 없이 바로 보이는 것 위주)
  - 레벨2(중1): 간단한 일차식/비율, 좌표평면 기초, 시저 암호(고정 이동), 2~3단서 논리
  - 레벨3(중2): 연립방정식, 확률 기초, 진법 변환, 3~4단서 논리, 모듈러 연산 초급
  - 레벨4(중3): 인수분해 수준 사고, 피타고라스, 모듈러 연산 응용, 4~5단서 종합 추리
- 지문/제목은 저택 테마로 통일: `[CAS FILE]`→`[저택의 기록]`, `[취조실]`→`[응접실]`, "요원"→"방문객", "보안 패널"→"낡은 자물쇠"/"오래된 장치" 등 (개별 문항 작성 시 문맥에 맞게 자연스럽게 적용)
- 힌트(`hint`)는 기존과 동일하게 배열 또는 단일 문자열, 1~2단계로 구성

### 4. 검증

- `pnpm lint && pnpm build` 통과
- 신규 `TileOrderInput`은 `pnpm dev`로 실제 탭 인터랙션 확인 (선택 순서 반영, 다시 섞기 동작, 정답 제출 확인)
- 레벨별로 최소 1개 방을 브라우저에서 직접 풀어 정답 처리 확인 (특히 `tile-order` 타입 문항)
- 120문항 전체는 이전 작업(퍼즐 정답 검증)과 동일한 방식으로 각 레벨 작성 후 정답을 직접 재계산해 검증

## 리스크 / 참고

- 문항 수가 120개로 많아, 레벨별(30개씩) 태스크로 나누어 작성하고 각 태스크마다 유형 분포와 정답 정확성을 별도로 검토한다.
- `tile-order` 정답 비교는 셔플된 화면 순서가 아니라 "탭한 순서"를 그대로 문자열화하므로, `room.answer`는 반드시 `tiles` 배열을 원래(정답) 순서대로 이어붙인 문자열과 정확히 일치해야 한다 — 문항 작성 시 이 규칙을 지킨다.
- 기존 uncommitted 상태였던 age/gender 관련 로직은 이번에 전부 커밋된 상태이므로, 이번 변경은 이미 커밋된 코드 위에 얹어진다.
