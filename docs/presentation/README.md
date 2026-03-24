# ATS Resume Analyzer — Presentation Package

This folder contains the full 2-hour presentation bundle, including deck sources, speaker materials, screenshots, end-to-end video tours, and a generated PowerPoint deck.

## Canonical files

- `ATS_Resume_Analyzer_2hr_Master_Presentation.pptx` — Primary exported PowerPoint deck with embedded notes and media.
- `SLIDE_DECK_2H.md` — Main markdown deck.
- `SLIDE_DECK_2H_MARP.md` — Presenter-optimized Marp deck.
- `SPEAKER_NOTES_2H.md` — Detailed narration and pacing notes.
- `CODE_SNIPPETS.md` — Representative backend/frontend snippets.
- `CODE_REVIEW_INSIGHTS.md` — Non-overtechnical engineering review.
- `DEMO_RUNBOOK.md` — Live demo execution sequence.
- `VIVA_QA_BANK.md` — Defense-style Q&A prep.
- `MARP_GUIDE.md` — Marp setup/export/presenter-mode guide.

## Compatibility aliases

Retained for old references:

- `ATS_Resume_Analyzer_2hr_Deck.md` → `SLIDE_DECK_2H.md`
- `ATS_Resume_Analyzer_2hr_Speaker_Notes.md` → `SPEAKER_NOTES_2H.md`

## Screenshot tours

- Desktop and mobile screenshot captures are in `screenshots/light/*` and `screenshots/dark/*`.
- Capture source: `ats-frontend/tests/e2e/tour-presentation.spec.ts` (tag: `@tour`).

Run command:

- From repo root: `npm --prefix ats-frontend run test:tour`

## End-to-end video tours (user + admin)

Generated output directory:

- `docs/presentation/videos/`

Generated files:

- `tour-user-desktop-light.webm` / `.mp4` — End-to-end user feature tour in light mode
- `tour-user-desktop-dark.webm` / `.mp4` — End-to-end user feature tour in dark mode
- `tour-admin-desktop-light.webm` / `.mp4` — End-to-end admin feature tour in light mode
- `tour-admin-desktop-dark.webm` / `.mp4` — End-to-end admin feature tour in dark mode

Coverage included in videos:

- **User tour coverage**
	- Login and signup page flows (entry UX)
	- Dashboard analysis workspace and connection state
	- Settings panel interactions and AI model selector expansion
	- Resume upload + job-description input + analyze submission flow
	- Analysis results page navigation
	- Resume management: list, detail, export buttons, edit form, preview modal, create form
	- History: analysis history navigation back to result details
	- Job Description Manager: create, edit, and delete actions
	- User logout and return-to-login flow

- **Admin tour coverage**
	- Admin entry from dashboard and `/admin` landing
	- User search and selection
	- Profile updates (name/tier) and save flow
	- Password reset action
	- Revoke-all-sessions action
	- Audit trail visibility
	- Return to dashboard flow

Run command:

- From repo root: `npm --prefix ats-frontend run test:tour:video`

Or direct Playwright command:

- `npx --prefix ats-frontend playwright test ats-frontend/tests/e2e/tour-presentation.spec.ts --project=chromium -g @tour-video`

## PPTX generation

Run commands:

- `npm --prefix ats-frontend run presentation:pptx`
- `npm --prefix ats-frontend run presentation:build`

`presentation:build` refreshes screenshots, refreshes videos, converts video assets to MP4 as needed with `ffmpeg`, and exports `ATS_Resume_Analyzer_2hr_Master_Presentation.pptx`.

## Recommended usage order

1. Present from `ATS_Resume_Analyzer_2hr_Master_Presentation.pptx`.
2. Use the embedded notes pane while speaking.
3. Keep `SPEAKER_NOTES_2H.md` open only as a backup script.
4. Use `DEMO_RUNBOOK.md` for live flow continuity.
5. Keep the embedded light/dark user/admin tour videos available as backup demo assets.
