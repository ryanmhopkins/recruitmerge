# RecruitMerge

RecruitMerge is a Chrome extension and web dashboard for capturing LinkedIn candidates into a clean, deduplicated sourcing list.

## Local setup

1. Copy `.env.example` to `apps/web/.env.local` and add the Supabase project URL and publishable key.
2. Run `npm install` from the repository root.
3. Run `npm run dev:web` for the dashboard or `npm run build:extension` for the extension.

The Vercel project should use `apps/web` as its root directory and define both variables from `.env.example` for Production, Preview, and Development.
