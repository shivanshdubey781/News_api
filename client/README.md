# NewsInvestigator — Mobile-First Frontend

Mobile-first news investigation application built for mass-communication diploma students doing practical news investigation and source verification.

## Architecture

- **React 18 + Vite 5** with TypeScript.
- **Tailwind CSS** with design tokens as CSS variables, dark mode support.
- **Framer Motion** for card press interactions, spring sheet animation, and transitions.
- **TanStack Query v5** for caching and server state.
- **Express Server (`server/`)**: Acts as a thin security gateway between the frontend and the FastAPI/LangChain AI backend (`ai-service/`). Handles httpOnly cookie authentication, rate limiting, and attaches the internal secret token (`X-Internal-Token`) so the browser never holds API keys.

---

## Getting Started

### 1. Run in Mock Mode (Zero setup, standalone)

In mock mode, the frontend serves realistic fixtures (10 news articles from Reuters, BBC, The Guardian, NDTV, etc., Compare tables, Timeline events, Verify checklists, and simulated SSE token streaming).

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173`. The application is fully clickable in mock mode!

### 2. Run with Express Gateway

In another terminal:

```bash
cd server
npm install
npm run dev
```

The Express server runs on `http://localhost:3001` and provides `/api/*` endpoints.

### 3. Run the Full Stack (Frontend + Express + FastAPI)

1. Start the FastAPI backend:
   ```powershell
   cd ai-service
   .\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8001
   ```
2. Start the Express server:
   ```bash
   cd server
   npm run dev
   ```
3. Start the React frontend:
   ```bash
   cd client
   npm run dev
   ```

---

## Testing & Production Build

### Unit & Integration Tests (Vitest + Testing Library)

```bash
cd client
npm test
```

Tests cover:
- `ArticleCard`: Renders title, badges, outlet count, and deterministic gradient fallback on image errors.
- `AiPanel`: Displays "Unverified" badges for unsourced claims, renders plain "Not found in the fetched sources", shows source chips, and handles quick-action prompts.
- `streamAsk`: Aborts cleanly mid-stream without throwing uncaught errors when the user hits Stop.

### Production Build

```bash
cd client
npm run build
```

---

## Design Specifications

- **Mobile First**: Optimized for 390x844 (also scales gracefully on 360x640 and 430x932). Centered max-width 430px column on desktop.
- **Typography**: Headlines in **DM Serif Display**, metadata in **DM Mono**, UI and body in **Outfit** (Light 300).
- **Grounding UI**:
  - Source chips showing outlet and publication date.
  - "Unverified" badge on unsourced statements.
  - Componentized responses: Compare tables, Timeline list, Verify checklist.
  - Grounding disclaimer: *"AI assists your research. Verify before publishing."*
