# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Small TypeScript (ESM, Node >= 18, native `fetch`) script that auto-books gym sessions on the TIMP platform and reports the outcome via Telegram. It is run by cron, not as a long-lived service. The README (in Italian) documents the cron schedule and the Telegram notification matrix.

## Commands

- `npm install`
- `npm run build` — `tsc` into `dist/` (note: `dist/` is committed to git, so rebuild it when changing `src/`)
- `npm run dev` — `tsx watch src/dashboard/main.ts` (dashboard with auto-reload)
- `npx tsx src/index.ts` — run the booking flow
- `npx tsx src/check-token.ts` — run the token validity check
- `npm test` — `node:test` via tsx (`src/**/*.test.ts`); no linter is configured.
- `npm run dashboard` — start the web dashboard (see below)

Requires a `.env` (copy from `.env.example`); `dotenv` loads it from the current working directory.

## Architecture

Two cron entry points share the same modules:

- `src/index.ts` — booking: `targetDate()` (today + 7 days, Europe/Rome) → `fetchAdmissions` → pick the first session with free spots → `bookAdmission` → `fetchTicket` → Telegram. Sunday has no sessions, so `bookingSchedule()` returns `null` and the script exits.
- `src/check-token.ts` — daily token check, refreshes if expired.

Supporting modules:

- `src/config.ts` — env-backed `config` object (mutable: `auth.ts` overwrites `timpApiToken` at runtime), plus `targetDate()` and `bookingSchedule()`. The target date's weekday equals today's weekday, which is why the schedule is keyed on the current day.
- `src/timp.ts` — TIMP API calls. Throws `AuthError` on 401; `bookAdmission` returns `null` for "already booked".
- `src/auth.ts` — `refreshToken()` logs in with `TIMP_EMAIL`/`TIMP_PASSWORD`, updates `config.timpApiToken` in memory **and rewrites `TIMP_API_TOKEN=` in `.env` on disk** (path resolved from `process.cwd()`).
- `src/telegram.ts` — `sendTelegram()` helper.

Token-expiry flow: `index.ts` catches `AuthError` from `book()`, calls `refreshToken()`, notifies on Telegram, and retries `book()` once. The top-level `main().catch` sends a Telegram error and exits 1.

`info.md` holds raw curl examples of the TIMP endpoints (admissions, ticket) useful as an API reference.

## Dashboard

`src/dashboard/` is a dependency-free `node:http` server (`main.ts` entry, `server.ts` routing, `handlers.ts` thin request/response code, static assets in `public/`, served from `src/` even when running `dist/`). It edits `data/settings.json` (per-weekday on/off, `src/settings/`) and shows `data/history.json` (`src/history/`, appended by `index.ts` via `recordHistory`). `index.ts` reads the settings and exits early when today's weekday is disabled. Zod schemas live in `schema.ts` files, inferred types in `types.ts`.
