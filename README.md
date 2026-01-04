# 🤔 Escape Room Web Game

A web-based interactive escape room experience featuring 25 stages of logic puzzles, math riddles, and lateral thinking challenges. Players progress through rooms, solving clues to unlock the next stage, with their session state persisted automatically.

## ✨ Features

- **25 Challenging Levels**: A curated sequence of puzzles ranging from "Alphabet Sequences" and "Logic Traps" to complex "Optimization Algorithms".
- **Diverse Puzzle Types**:
    - 🧩 **Logic & Patterns**: Deduce rules from sequences and shapes.
    - 🔢 **Math & Calculation**: Solve riddles involving numbers and equations.
    - 💡 **Lateral Thinking**: "Out of the box" solutions where the obvious answer is often wrong.
    - 🕵️ **Observation**: Find clues hidden in plain sight or keyboard layouts.
- **Persistent Sessions**: Game progress (current room, hints used) is saved via Redis, allowing players to resume later.
- **Real-time Leaderboard**: A finish screen that ranks players by their total completion time.
- **Responsive Design**: precise UI built with Tailwind CSS, suitable for desktop and mobile.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- **Language**: TypeScript / React 19
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: Tailwind CSS
- **Backend Storage**: Redis (accessed via HTTP API)
- **Deployment**: PM2 (Process Manager)

## 🚀 Getting Started

### Prerequisites
- Node.js 22.0.0 or higher
- pnpm (enable with `corepack enable`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd escape-room
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-gateway.com
   ```
   > **Note**: The application expects an API that exposes endpoints like `/v1/redis/escape_{username}` for session management.

4. **Run Locally**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to start the game.

## 📂 Project Structure

```bash
src/
├── app/
│   ├── start/           # Player registration & session creation
│   ├── escape/[roomId]/ # Main game interface (Dynamic Routing)
│   └── finish/          # Leaderboard & final results
├── lib/
│   ├── rooms.ts         # 🛑 CORE GAME DATA (Questions, Answers, Hints)
│   └── api/             # Redis client wrapper
└── store/               # Zustand store for client-side state
```

## 🌍 Deployment using PM2

This project includes pre-configured scripts for deployment using PM2.

- **Start/Deploy**:
  ```bash
  pnpm pm2:start
  ```
  *Performs: `git pull` -> `build` -> `pm2 start` on port **10050**.*

- **Restart**:
  ```bash
  pnpm pm2:restart
  ```
  *Performs: `git pull` -> `build` -> `pm2 restart`.*

- **Other Commands**:
  - `pnpm pm2:stop`: Stop the server.
  - `pnpm pm2:logs`: View real-time server logs.
  - `pnpm pm2:monit`: Monitor server resources.

## 📝 Editing Game Content

All puzzle data is located in `src/lib/rooms.ts`. To add or modify a stage:

```typescript
{
    id: 26, // Unique ID
    title: 'New Puzzle',
    question: 'Riddle text here...',
    answer: 'key', // The answer players must type
    hint: 'Helpful clue...',
    type: 'Logic',
    difficulty: 5
}
```

---
*Escape Room Project*
