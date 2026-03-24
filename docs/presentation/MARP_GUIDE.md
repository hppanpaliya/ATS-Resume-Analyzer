# Marp Presentation Guide

This guide explains how to use and export the Marp-optimized slide deck.

## What is Marp?

**Marp** is a Markdown presentation framework that converts `.md` files into beautiful, web-based presentations with support for:
- Presenter notes (speaker view)
- Slide navigation and timing
- Smooth animations and themes
- PDF/HTML export
- Built-in presenter timer

## Using `SLIDE_DECK_2H_MARP.md`

### Option 1: View Online (Marp CLI)

If you have Node.js installed:

```bash
# Install Marp CLI globally
npm install -g @marp-team/marp-cli

# Navigate to presentation folder
cd docs/presentation

# View in development mode (auto-reload on save)
marp SLIDE_DECK_2H_MARP.md -s

# Open http://localhost:8080 in your browser
```

### Option 2: Export to HTML

```bash
# Generate standalone HTML file
marp SLIDE_DECK_2H_MARP.md -o SLIDE_DECK_2H.html

# Open in browser
open SLIDE_DECK_2H.html
```

### Option 3: Export to PDF

```bash
# Generate PDF (requires Chrome/Chromium)
marp SLIDE_DECK_2H_MARP.md -o SLIDE_DECK_2H.pdf --allow-local-files
```

## Presenter Mode

When running `marp -s`:
- **Click the window** to enter presenter mode
- **Left pane:** Current slide
- **Right pane:** Notes + next slide preview
- **Bottom bar:** Timer and slide counter
- **Keyboard shortcuts:**
  - `→` / `←` : Next/previous slide
  - Space: Start presentation
  - F: Fullscreen
  - P: Presenter notes toggle

## Presenter Notes

Notes are embedded in HTML comments:
```markdown
<!-- _paginate: false -->
<!-- notes: (0–2 min) Welcome and introduce... -->
```

In presenter mode, these appear in the notes pane for reference.

## Timing Checkpoints

The deck is structured with ~120 minutes of content across 45 main slides + 12 optional backup slides:

- **Slides 1–7:** Opening (18 min)
- **Slides 8–14:** Architecture (20 min)
- **Slides 15–22:** Security (23 min)
- **Slides 23–29:** Frontend (20 min)
- **Slides 30–32:** Testing (12 min)
- **Slides 33–39:** Walkthrough (15 min)
- **Slides 40–45:** Review + Close (12 min)
- **Backup Slides:** Deep dives on demand

## End-to-End Video Tours (User + Admin)

The presentation package now includes deterministic feature-tour video generation from Playwright.

Generated files:
- `docs/presentation/videos/tour-user-desktop-light.webm`
- `docs/presentation/videos/tour-user-desktop-dark.webm`
- `docs/presentation/videos/tour-admin-desktop-light.webm`
- `docs/presentation/videos/tour-admin-desktop-dark.webm`

Coverage checklist:
- User flow: auth entry screens, settings/model selector, resume upload + analyze, analysis results, resume management actions, history navigation, job-description CRUD, logout.
- Admin flow: admin console entry, user search/select, profile update, password reset, session revocation, audit trail visibility, return-to-dashboard.

Run from repo root:

```bash
npm --prefix ats-frontend run test:tour:video
```

Equivalent direct command:

```bash
npx --prefix ats-frontend playwright test ats-frontend/tests/e2e/tour-presentation.spec.ts --project=chromium -g @tour-video
```

## Customization

### Change Theme
Edit the YAML frontmatter:
```yaml
theme: default  # or: gaia, uncover, apple
```

### Adjust Colors
```yaml
class: invert     # or: lead, gaia
backgroundColor: #1a1a2e
color: #eaeaea
```

### Add More Presenter Notes
Insert before any slide:
```markdown
<!-- notes: (X–Y min) Your speaker notes here -->
```

## Tips for Delivery

1. **Run through once:** Practice with `marp -s` to familiarize yourself with slides and timing
2. **Use speaker notes:** Read from the presenter view, not the slides
3. **Backup plan:** If Marp doesn't work, use `SLIDE_DECK_2H.md` (plain markdown) or print the HTML
4. **Track time:** The built-in timer helps you stay on pace
5. **Engage early:** Invite questions after the opening (slides 1–7)

## Troubleshooting

**Marp CLI not found:**
```bash
npm install -g @marp-team/marp-cli
```

**Images not showing in PDF export:**
```bash
marp SLIDE_DECK_2H_MARP.md -o output.pdf --allow-local-files
```

**Want to hide backup slides in counting:**
- Use `<!-- _footer: -->` to turn off slide numbers on backup slides

**Need to adjust layout:**
- Edit the CSS in the YAML frontmatter or create a custom theme file

## Additional Resources

- **Marp GitHub:** https://github.com/marp-team/marp
- **Marp CLI Docs:** https://github.com/marp-team/marp-cli
- **Markdown Syntax:** https://marp.app/#syntax

---

## Quick File Reference

| File | Purpose | Use Case |
|---|---|---|
| `SLIDE_DECK_2H_MARP.md` | Marp-optimized deck | View in presenter mode, export to PDF/HTML |
| `SLIDE_DECK_2H.md` | Markdown deck | Backup if Marp unavailable, plain reading |
| `SPEAKER_NOTES_2H.md` | Detailed narration | Detailed script + timing |
| `README.md` | Index | Navigation and overview |
