# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slotto is a "slow social media" full-stack web app with daily posting features. It's in early development — auth controller is stubbed, most API routes are TODOs, and the model layer doesn't exist yet despite Sequelize being installed.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Express 5, TypeScript, pg-promise, Sequelize (not yet used), bcrypt
- **Database:** PostgreSQL 16 (Docker), database name is `dailyposts`
- **Monorepo layout:** `frontend/` and `backend/` are separate npm projects (no workspace)

## Development Commands

### Database
```bash
docker compose up -d          # Start PostgreSQL container (user: dev, password: dev, port: 5432)
```

### Backend (from `backend/`)
```bash
npm run dev                   # Start dev server with nodemon + ts-node (port 3001)
npm run build                 # Compile TypeScript
npm start                     # Run compiled JS
```

### Frontend (from `frontend/`)
```bash
npm run dev                   # Next.js dev server (port 3000)
npm run build                 # Production build
npm run lint                  # ESLint
```

No test framework is configured yet.

## Architecture

```
frontend/src/app/             # Next.js App Router pages (file-based routing)
  page.tsx                    # Home — client component checking API/DB connectivity
  signup/page.tsx             # Signup form (basic HTML form, no client validation)

backend/src/
  index.ts                    # Express entry point, middleware setup, /health route
  config/database.ts          # pg-promise connection (hardcoded to localhost:5432/dailyposts)
  routes/api.ts               # /api/* routes — mostly stubs with TODO comments
  routes/web.ts               # Web routes (just /signup placeholder)
  controllers/auth.controller.ts  # Incomplete — imports bcrypt, references missing User model
  init.sql                    # Schema: users and posts tables with indexes
```

### Database Schema (init.sql)

Two tables: `users` (username, email, password_hash, timezone, profile_pic, last_post_date) and `posts` (content, user_id FK, repost support via is_repost/original_post_id/original_user_id, repost_count).

### Frontend-Backend Communication

Frontend fetches directly from `http://localhost:3001` with CORS enabled (permissive). No API client abstraction exists — raw `fetch` calls in components.

## Known Issues

- Database connection in `config/database.ts` has hardcoded credentials instead of using env vars (`.env.example` exists but isn't consumed)
- Signup form POSTs to `/api/users/signup` but no POST handler exists (only a GET stub)
- Auth controller references a User model that doesn't exist
