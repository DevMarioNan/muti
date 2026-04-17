# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema changes to database
```

## Architecture

### Next.js 16 (Breaking Changes)

This project uses **Next.js 16.2.4**, which has significant breaking changes from versions in training data. Before writing any Next.js code, read the guide at `node_modules/next/dist/docs/` and heed any deprecation notices.

Key differences in Next.js 16:
- App Router conventions may have changed
- API routes and file structure conventions differ from older versions
- Check `node_modules/next/dist/docs/` for current best practices

### Prisma Setup

The Prisma client is generated to a **custom location**: `app/generated/prisma` (not `node_modules`). Import from this path:

```typescript
import { PrismaClient } from "@/app/generated/prisma/client"
```

The `url` in `prisma/schema.prisma` uses `env("DATABASE_URL")` and the datasource configuration is also in `prisma.config.ts`. The URL is resolved at runtime from the environment variable.

### Database Singleton

Use `lib/db.ts` for the Prisma singleton:

```typescript
import { prisma } from "@/lib/db"
```

### Project Structure

- `app/` — Next.js App Router (app directory)
- `app/page.tsx` — Landing page
- `app/layout.tsx` — Root layout with Geist fonts via CSS variables
- `app/globals.css` — Global styles
- `app/generated/prisma/` — Generated Prisma client
- `prisma/schema.prisma` — Database schema
- `prisma.config.ts` — Prisma configuration

### Tailwind CSS v4

This project uses **Tailwind CSS v4**, which has a new CSS-based configuration approach (no `tailwind.config.ts` by default). Styles are typically configured in `globals.css` using `@import "tailwindcss"`.

### Font Loading

Fonts (Geist, Geist_Mono) are loaded via `next/font/google` and applied via CSS custom properties (`--font-geist-sans`, `--font-geist-mono`) defined on the `<html>` element.
