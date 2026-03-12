# Claude Code Instructions

## Task Tracking: USE BEADS

**CRITICAL**: This project uses `bd` (beads) for task tracking. Do NOT use TodoWrite.

```bash
# Check current tasks
bd list
bd ready

# Update task status
bd update <id> --status in_progress
bd update <id> --status closed

# Create subtasks
bd create "Task title" -p 1 --description "Details"
```

**Current Epic**: `workspace-6nv` - Implement Notion-like features

Run `bd list` at the start of every session to see current state.

## Project Overview

Next.js 16 + Supabase + BlockNote editor workspace app implementing Notion-like features:
- Phase 1: Custom blocks (DONE)
- Phase 2: Databases with 6 view types (IN PROGRESS)
- Phase 3: Templates
- Phase 4: Nested Pages UI
- Phase 5: Real-Time Collaboration
- Phase 6: Synced Blocks & API

## Testing Loop

After completing work, always run:
```bash
npm run build
```

## Database

- Supabase URL: https://ctzubzyarfbvziqglrzk.supabase.co
- Auth is disabled for testing
- Test user ID: 00000000-0000-0000-0000-000000000001
