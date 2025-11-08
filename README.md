# Escape Room

웹 기반 10단계 방탈출 게임입니다. 플레이어는 `/start`에서 이름을 등록하면 퍼즐 방을 순차적으로 탐험하고, 힌트는 총 3회까지 사용 가능합니다. 진행 상황은 로컬 스토리지와 Redis API(`https://api.sosohappy.synology.me/v1/redis/...`)에 동시에 기록되어 기기와 브라우저가 달라도 이어서 플레이할 수 있습니다.

## 주요 특징
- **App Router 기반 UI**: `src/app` 폴더에 랜딩, 입력, 퍼즐, 종료 페이지를 분리해 유지보수를 단순화했습니다.
- **데이터 중심 퍼즐 관리**: `src/lib/rooms.ts`에서 퍼즐 메타데이터(질문, 답, 힌트, 난이도)를 일괄 정의하고 `Room` 타입 (`src/types/room.ts`)으로 검증합니다.
- **전역 상태 관리**: `src/store/gameStore.ts`가 현재 방, 남은 힌트, 타이밍, 사용자 메타데이터를 Zustand로 관리하며 `localStorage`와 동기화합니다.
- **원격 진행 정보**: 각 방 진입과 완료 시 Redis API에 장치 정보와 진행도, 클리어 시간을 기록하여 중복 참여와 랭킹 집계를 지원할 준비가 되어 있습니다.
- **배포 스크립트 연동**: `eco.config.js`는 PM2와 연동되어 `pnpm pm2:start|stop|restart` 명령으로 동일한 프로세스 구성을 유지합니다.

## 기술 스택
Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS · shadcn/ui · Zustand · Redis(원격 API) · PM2

## 프로젝트 구조
```
src/
  app/                # Next.js 라우트 (page.tsx, start, escape/[roomId], finish 등)
  lib/rooms.ts        # 10개 퍼즐 정의
  store/gameStore.ts  # 게임 진행 상태와 메타데이터
  types/room.ts       # Room, GameState 인터페이스
public/images/        # 방별 배경과 UI 자산 (escape_room_{id}.png 등)
spec.md               # 게임 기획 및 룸 상세 요구사항
AGENTS.md             # 기여자 가이드
```

## 시작하기
1. Node.js 22 이상과 pnpm을 설치합니다.
2. 의존성 설치: `pnpm install`
3. 개발 서버: `pnpm dev` 후 `http://localhost:3000` 접속
4. 프로덕션 빌드: `pnpm build`
5. 로컬 프로덕션 서버(포트 10050): `pnpm start`

### 유용한 스크립트
| 명령 | 설명 |
| --- | --- |
| `pnpm lint` | Next.js 기반 ESLint 검사 실행 |
| `pnpm format` / `pnpm format:check` | Prettier 포맷 적용/검증 |
| `pnpm pm2:start` | git pull → build → PM2로 `eco.config.js` 실행 |
| `pnpm pm2:restart` | 원격 배포 서버 재시작 시나리오 |

## 퍼즐/데이터 작업 흐름
1. `spec.md`로 스토리 보드와 난이도 가이드를 확인합니다.
2. 새 퍼즐을 `src/lib/rooms.ts`에 추가하거나 기존 퍼즐의 `question`, `answer`, `hint`, `difficulty`를 수정합니다.
3. 필요 시 `public/images/escape_room_{id}.png`에 해당하는 배경 이미지를 교체합니다.
4. 상태 로직이 필요하면 `useGameStore`에 action을 추가하고 관련 페이지에서 호출합니다.

## 테스트 및 검증
자동화 테스트는 아직 준비되지 않았으므로, `pnpm dev` 환경에서 `/start → /escape/[roomId] → /finish` 흐름을 수동으로 확인하세요. 정답 판정, 힌트 차감, 진행도 저장(localStorage 및 Redis API 호출 로그)을 브라우저 DevTools Network 탭으로 점검하면 문제를 빠르게 파악할 수 있습니다. 향후 React Testing Library 또는 Playwright 기반 시나리오 테스트를 `src/__tests__` 이하에 추가하는 것을 권장합니다.

## 배포/운영 팁
- `package.json`의 `engines.node` 요구 사항을 만족하는지 확인 후 빌드하세요.
- 배포 서버에서는 `pnpm pm2:restart`로 코드 동기화 및 재시작을 동시에 진행합니다.
- Redis 엔드포인트나 기타 비공개 설정이 필요한 경우 `.env.local`에 주입하고 Next.js `process.env`를 통해 참조하되, 민감한 정보는 커밋하지 마세요.
