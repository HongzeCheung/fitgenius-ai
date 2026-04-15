# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitGenius AI is a fitness companion web app providing a "plan-execute-review" closed loop with Google Gemini AI integration. Live site: https://www.fitgenius.cloud/

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS (loaded via CDN)
- **AI**: Google Gemini API (`@google/genai`)
- **Visualization**: Recharts
- **Package Manager**: pnpm

## Key Commands

```bash
pnpm dev       # Start dev server on port 3000
pnpm build     # Production build
pnpm preview   # Preview production build
```

No linting, formatting, or test framework is configured.

## Architecture

This is a single-page app with:

| Path | Purpose |
|------|---------|
| `App.tsx` | Main orchestrator (~17KB), tab-based navigation within a single page |
| `types.ts` | All TypeScript types/interfaces (GoalType, WorkoutLog, TrainingReport, etc.) |
| `components/` | React components (Dashboard, AICoach, WorkoutLogger, AnalysisReport, ExerciseDetail, Auth, Icons, Spinner) |
| `services/` | Backend/AI services — `geminiService.ts` (Gemini integration), `backend.ts` (REST API calls) |
| `index.tsx` | React entry point |

The backend is external (Express + MongoDB deployed on Render). `services/backend.ts` makes REST calls to that server. This repo is frontend only. The `mongodb` driver and `express` in package.json are dependencies for a separate server repo — there is no Express code or `server.js` here.

## Configuration

- **Vite** (`vite.config.ts`): Dev server runs on port 3000. Injects `GEMINI_API_KEY` from `.env.local` into env vars.
- **TypeScript** (`tsconfig.json`): Targets ES2022, uses `react-jsx` transform, `bundler` module resolution. Path alias `@/*` maps to project root.
- **`index.html`**: Tailwind via CDN, Google Inter font, custom CSS for scrollbars and number input spinners.

## Notes

- The app UI is primarily in **Chinese** (labels, enums, README).
- `USE_MOCK_BACKEND` flag in backend config enables switching between mock and production API.
- AI analysis results are cached in session; reports only re-generate when new training logs are added.
