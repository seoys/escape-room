# 이미지(시각)형 퍼즐 프레임워크 + 샘플 19유형

## 배경

현재 120문항(레벨 4 × 30방, 방마다 변형 a/b/c)은 대부분 텍스트 지문과 텍스트·숫자 입력으로 풀린다. 유형 분포는 연산 28, 암호 19, 타일배열 18, 도형 15, 관찰 15, 추리 14, 넌센스 9, 규칙추리 8이다. 사용자는 문제 유형 구성을 바꾸려 한다. 연산 중심에서 벗어나, **이미지를 보고 푸는 시각형 퍼즐**(글자 격자, 쪽지, 이모지 수식, 열쇠 고르기, 만화 순서, 패턴 행렬, 미로 등)을 중심으로 한다.

## 목표

1. 문항이 텍스트 지문 외에 시각 요소(`visual`)와 보기(`options`)를 가질 수 있게 한다.
2. 시각 요소는 6종 렌더러로 그린다. 코드로 그릴 수 있는 것은 SVG/React, 어려운 것은 새로 제작한 SVG 일러스트(`public/puzzles/`)를 쓴다.
3. 보기 선택(`choice`) UI를 새로 만든다. 현재 `inputType: 'choice'`는 타입에만 있고 UI·데이터가 없다.
4. `tile-order`가 이미지 타일을 지원하게 한다(만화 컷 순서 배열).
5. 19개 유형을 대표하는 샘플 문항을 만들어 레벨 1의 19개 방을 교체한다.
6. 정답은 지금처럼 서버에서만 검증하고 클라이언트에 노출하지 않는다.

## 비목표

- 나머지 약 100문항, 레벨 2~4의 이미지형 교체(프레임워크 검증 후 후속 작업)
- 드래그 앤 드롭 등 새 인터랙션(탭 선택만 사용)
- `verifyAnswer` 로직 변경
- 낡은 `spec.md`(10방 기준) 갱신
- 웹에서 가져온 이미지의 사용. 유형만 참고하고 숫자·단어·그림은 모두 새로 만든 값을 쓴다.

## 설계

### 1. 데이터 모델 (`src/types/room.ts`)

`Room`과 `RoomVariant`에 선택 필드를 추가한다. 모두 표시용 데이터이며 정답을 포함하지 않는다.

```ts
visual?: PuzzleVisual;
options?: ChoiceOption[];          // inputType === 'choice'일 때 사용
tileImages?: Record<string, string>; // tile id -> 이미지 경로 (tile-order용)

type PuzzleVisual =
  | { kind: 'image'; src: string; alt: string; width: number; height: number }
  | { kind: 'grid'; rows: GridCell[][]; caption?: string }
  | { kind: 'note'; title?: string; lines: string[]; style?: 'diary' | 'list' | 'warning' }
  | { kind: 'symbol-rows'; rows: SymbolRow[]; background?: 'none' | 'clock' }
  | { kind: 'shape-matrix'; cells: ShapeCell[] }   // 길이 8, 9번째 칸은 빈칸(?)
  | { kind: 'statements'; speakers: { id: string; name: string; says: string }[] };

type GridCell = { text?: string; arrow?: 'up' | 'down' | 'left' | 'right'; mark?: 'hidden' | 'highlight' };
type SymbolRow = { items: SymbolItem[]; value?: string };   // value가 없으면 풀어야 할 줄(?)
type SymbolItem = { glyph?: string; color?: string; op?: '+' | '-' | '×' | '=' };
type ShapeCell = { marks: { shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'heart' | 'star'; filled: boolean; slot: number }[] };
type ChoiceOption = { value: string; label?: string; image?: string; cell?: ShapeCell };
```

- `inputType`은 기존 유니온을 그대로 쓴다(`'choice'` 포함). 새 값은 추가하지 않는다.
- 선택 정답은 옵션의 `value` 문자열이고, 기존 `verifyAnswer`의 정규화 비교(공백 제거·소문자화)를 그대로 쓴다. 옵션 `value`는 `A`~`H`, `1`~`4` 같은 중립 id로 만들고 정답 여부를 암시하지 않는다.
- `visual`과 `options`가 없는 기존 문항은 지금처럼 동작한다.

### 2. 컴포넌트 (`src/components/puzzle-visuals/`)

| 파일 | 역할 |
| --- | --- |
| `PuzzleVisual.tsx` | `visual.kind`에 따라 아래 컴포넌트를 선택해 렌더링 |
| `ImageVisual.tsx` | `next/image`로 일러스트 표시 |
| `GridVisual.tsx` | 글자·숫자 격자. 화살표, 숨김/강조 칸 지원 |
| `NoteVisual.tsx` | 일기 쪽지, 단어 목록, 경고문 카드 |
| `SymbolRowsVisual.tsx` | 이모지·색·글자 수식 줄. 시계판 배경 옵션 |
| `ShapeMatrixVisual.tsx` | 3x3 도형 패턴과 빈칸. `ShapeCellView`를 보기 렌더링에도 export |
| `StatementsVisual.tsx` | 인물과 말풍선 |

- `src/components/ChoiceInput.tsx`를 새로 만든다. 보기 카드를 탭해 하나를 선택하고 선택 값을 `onChange(value)`로 올린다. 상태 소스는 `TileOrderInput`과 같은 방식(선택 인덱스)이다.
- `TileOrderInput.tsx`는 `tileImages` prop을 선택적으로 받는다. 있으면 타일을 이미지로, 없으면 지금처럼 텍스트로 표시한다. 정답은 선택한 타일 id를 이어붙인 문자열이다(예: `31254`).
- `RoomClient.tsx`는 질문 박스 아래에 `<PuzzleVisual>`을 렌더링하고, 입력부에 `choice` 분기를 추가한다. `roomId === 10`의 하드코딩 이미지는 건드리지 않는다.
- 스타일은 기존 황동 테두리, `btn-antique`, `antique-input` 톤을 따른다. 모바일 폭에서 가로 스크롤이 없어야 한다.
- 모든 시각 요소는 `alt`/`aria-label`을 갖는다.

### 3. 서버와 데이터 흐름

- `src/app/escape/[roomId]/page.tsx`의 정제 객체는 허용 필드를 직접 나열한다. 여기에 `visual`, `options`, `tileImages`를 추가한다. `answer`는 계속 제외한다.
- `src/lib/rooms-data.ts`는 `server-only` 모듈이므로 클라이언트에 번들되지 않는다. 시각 데이터는 정제 객체를 통해서만 전달된다.
- 교체한 방은 변형 없이 단일 문항으로 둔다. 변형이 없으면 `page.tsx`가 방 자체를 사용한다.

### 4. 유형 카탈로그와 교체할 레벨 1 방

각 문항은 새로 만든 오리지널 값을 쓴다. 교체 대상은 같은 성격의 기존 방이며, 연산 방 6개를 모두 교체하므로 레벨 1의 연산 비중은 사라진다. 어려운 순으로 방 순서를 다시 맞추지는 않고 기존 `difficulty` 값을 문항에 맞게 조정한다.

| 방 id | 기존 | 신규 유형 | 렌더러 | 입력 |
| --- | --- | --- | --- | --- |
| 2 | 촛불의 흔적(연산) | 이모지 수식 | `symbol-rows` | number |
| 7 | 정원의 장미(연산) | 색-숫자 치환 | `symbol-rows` | number |
| 12 | 은촛대 무게(연산) | 시계 수식(12시간제) | `symbol-rows` | number |
| 16 | 복도의 촛불 간격(연산) | 글자 구멍 세기 | `symbol-rows` | number |
| 20 | 하인들의 새참(연산) | 그림 속 수치 눈속임(앵무새 키) | `image` | number |
| 26 | 초의 개수(연산) | 숫자 표 규칙(두 열 수열) | `grid` | number |
| 13 | 시계의 각도(관찰) | 열쇠 고르기 | `image` | choice |
| 22 | 촛대 무늬(관찰) | 3x3 패턴 행렬(A~H) | `shape-matrix` | choice |
| 27 | 그림 속 숫자(관찰) | 키패드 조각 | `grid` | number |
| 8 | 액자의 둘레(도형) | 수도관 흐름 추적 | `image` | choice |
| 17 | 정원의 화단(도형) | 같은 색 문 미로 | `image` | choice |
| 23 | 삼각 지붕(도형) | 글자 타일 조합 + 경고문(`caption`에 표시) | `grid` | text |
| 29 | 정원의 오각형 분수(도형) | 화살표 경로 읽기 | `grid` | text |
| 4 | 알파벳 합계(암호) | 3x3 글자 격자 + 초성 힌트 | `grid` | text |
| 14 | 책장의 순서(암호) | 일기 쪽지 첫 글자(아크로스틱) | `note` | text |
| 28 | 자리 바꾸기(암호) | 단어 목록 공통 규칙 | `note` | text |
| 15 | 정원사의 알리바이(추리) | 거짓말 진술 추리 | `statements` | choice |
| 25 | 다락방의 열쇠(추리) | 가위바위보 순환 우열 | `note` | choice |
| 11 | 사건의 순서(타일배열) | 5컷 만화 순서 배열 | `image` 타일 | tile-order |

- 문제 텍스트(`question`)는 저택 서사의 짧은 지시문으로 유지하고, 풀이에 필요한 정보는 시각 요소에 둔다.
- 힌트(`hint`)는 기존처럼 문자열 또는 문자열 배열이다.
- 일러스트가 필요한 방(20, 13, 8, 17, 11)은 제작한 SVG를 `public/puzzles/room-<id>-*.svg`에 둔다. 샘플 일러스트는 단순한 선화 수준이며, 이후 더 나은 이미지로 교체할 때는 `src`만 바꾸면 된다.

### 5. 오류 처리와 경계

- 알 수 없는 `visual.kind`나 비어 있는 `options`는 렌더러가 빈 화면 대신 텍스트 지문만 표시하도록 방어한다(개발 중에는 콘솔 경고).
- 선택 입력에서 아무것도 고르지 않고 제출하면 기존 빈 입력과 같은 처리를 한다.
- 이미지 로드 실패 시 `alt` 텍스트가 보이게 한다.

### 6. 검증

- 자동 테스트 harness가 없다. 검증 스크립트로 모든 문항의 `visual`·`options`·`tileImages` 정합성(정답이 보기에 포함됨, 타일 id 일치, 이미지 파일 존재)을 검사한다. 실행 방식(devDependency `tsx` 추가 여부)은 구현 계획에서 정한다.
- `pnpm lint`, `pnpm build`를 통과해야 한다.
- dev 서버에서 교체한 19개 방을 직접 풀어, 정답 처리와 오답 처리, 힌트, 모바일 폭 표시를 확인한다.
- 클라이언트로 전달되는 RSC 페이로드에 `answer`가 없는지 확인한다.

## 위험과 미결정 사항

- 샘플 일러스트(만화, 열쇠, 수도관, 미로, 앵무새)의 품질은 SVG 수작업 수준이다. 서비스 품질이 필요하면 별도 이미지 제작이 필요하다.
- 시각형 문항은 난이도 보정이 어렵다. 샘플 단계에서 사용자가 직접 풀어 보고 `difficulty`를 조정한다.
- 레벨 2~4와 나머지 문항의 이미지형 교체 일정은 이 작업 범위에 포함되지 않는다.
