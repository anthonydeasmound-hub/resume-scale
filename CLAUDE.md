# ResumeScale - Claude Code Instructions

## Project Overview
Job application management app with AI-powered resume and cover letter generation.
Stack: Next.js App Router, TypeScript, SQLite (better-sqlite3), Puppeteer for PDF generation, Gemini/Groq AI

## Git Shortcuts

When I say these phrases, run the corresponding commands:

### "save [message]"
```bash
git add . && git commit -m "[message]" && git push
```
Creates a checkpoint I can return to.

### "status"
```bash
git status && git branch
```
Shows current changes and which branch I'm on.

### "back to safe"
```bash
git checkout main
```
Returns to the stable main branch.

### "start experiment [name]"
```bash
git checkout -b [name]
```
Creates a new branch for experimenting.

### "delete experiment"
```bash
git checkout main && git branch -D [current-branch-name]
```
Abandons experiment and returns to main.

### "undo changes"
```bash
git checkout .
```
Discards all uncommitted changes (keeps committed work).

### "go back one save"
```bash
git reset --soft HEAD~1
```
Undoes the last commit but keeps the changes staged.

## Dev Shortcuts

### "run"
Start the dev server: `npm run dev`

### "restart"
Kill existing dev server and run `npm run dev` again.

### "test build"
Run `npm run build` to check for errors.

## Current Safe Points

- Main branch: https://github.com/anthonydeasmound-hub/resume-scale
- Initial stable commit: f959c86 "Initial commit - stable version before PDF experiments"

## Notes
- Always "save" before starting new experiments
- Use "status" to check if there are unsaved changes before switching branches
