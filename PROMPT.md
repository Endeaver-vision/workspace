# Training Platform Development Loop

## Mission
Transform the existing Notion-like workspace app into a **Corporate Training Platform**.

**Read BUILD_PLAN.md for complete implementation details.**

## Development Loop

### Step 1: Check Current Task
```bash
bd ready
```
Pick the highest priority open task.

### Step 2: Mark In Progress
```bash
bd update <task-id> --status in_progress
```

### Step 3: Read Task Details
```bash
bd show <task-id>
```
Review the completion criteria and browser tests required.

### Step 4: Implement
- Follow the file structure in BUILD_PLAN.md
- Match existing code patterns
- Keep changes focused

### Step 5: Build Check
```bash
npm run build
```
Fix all TypeScript and build errors before proceeding.

### Step 6: Browser Testing (REQUIRED for UI phases)
For phases 2-8, you MUST verify with Playwright:

```typescript
// Use mcp__playwright__browser_navigate to open pages
// Use mcp__playwright__browser_snapshot to verify content
// Use mcp__playwright__browser_take_screenshot to capture proof
// Use mcp__playwright__browser_click to test interactions
```

**Screenshot naming convention:**
- Store in: `screenshots/phase{N}/`
- Name per BUILD_PLAN.md requirements

**Test as end user would:**
1. Navigate to the page
2. Take screenshot of initial state
3. Perform user actions (click, type, submit)
4. Verify expected results appear
5. Take screenshot of final state

### Step 7: Commit
```bash
git add -A && git commit -m "feat(phase-N): description"
```

### Step 8: Mark Complete
```bash
bd update <task-id> --status closed
```

### Step 9: Continue or Complete
```bash
bd ready
```
If tasks remain, continue. If all phases closed, output completion promise.

## Completion Promise
When ALL phases (workspace-4sv.1 through workspace-4sv.8) are `closed`:
```
<promise>TRAINING PLATFORM COMPLETE</promise>
```

## Phase Completion Checklist

### Phase 1: Database & Foundation
- [ ] Migration applied
- [ ] Types file exists
- [ ] All stores created
- [ ] `npm run build` passes

### Phase 2: SOP Database
- [ ] `/sops` page works
- [ ] Can create/edit SOPs
- [ ] Categories in sidebar
- [ ] Search works
- [ ] Screenshots: sop-library, sop-editor, sop-search, sop-category

### Phase 3: Quiz Builder
- [ ] Quiz builder works
- [ ] Can add questions
- [ ] Can take quiz
- [ ] Pass/fail shows
- [ ] Screenshots: quiz-builder, quiz-taking, quiz-results

### Phase 4: Progress Tracking
- [ ] Learner dashboard works
- [ ] Status badges show
- [ ] Compliance report works
- [ ] Screenshots: dashboard, badges, report

### Phase 5: User Management
- [ ] User list works
- [ ] Can change roles
- [ ] Can assign SOPs
- [ ] Screenshots: user-list, role-selector, assign-modal

### Phase 6: Certificates
- [ ] Certificate generates on pass
- [ ] Can view/download
- [ ] Screenshots: certificates, preview, pdf

### Phase 7: AI Integration
- [ ] AI search works
- [ ] Quiz generation works
- [ ] Summarization works
- [ ] Chat works
- [ ] Screenshots: ai-search, ai-generate, ai-summary, ai-chat

### Phase 8: UI Polish
- [ ] Corporate theme applied
- [ ] Navigation works
- [ ] Role-based views
- [ ] Screenshots: welcome, dashboards, breadcrumbs, overview

## Key Commands

```bash
# Beads
bd list                    # All tasks
bd ready                   # Ready tasks
bd show <id>               # Task details
bd update <id> --status X  # Update status

# Build
npm run build              # Check for errors
npm run dev                # Start dev server

# Git
git add -A && git commit -m "message"
git push
```

## Do NOT
- Skip browser testing for UI work
- Leave build errors
- Work on multiple phases at once
- Forget to take screenshots
- Mark complete without verifying

## Current Tech Stack
- Next.js 16 (App Router)
- React 19, Zustand, Supabase
- BlockNote editor
- Tailwind CSS + shadcn/ui
- Playwright for testing
