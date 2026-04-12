# TrainHub Handoff for Aries

**Date**: April 12, 2026
**From**: Claude (current session)
**To**: Aries (Mac Mini)

## Project Overview

TrainHub is a staff training platform built with Next.js 16 + Supabase. It provides SOPs, quizzes, certificates, and an AI assistant for optical practice staff training.

## Infrastructure

### VPS Details
- **IP**: 2.24.194.99
- **SSH Access**: `ssh root@2.24.194.99`
- **PM2 Process**: `trainhub` running on port 3001
- **Cloudflare Tunnel ID**: `08cff96e-852d-4f4f-870b-2f1250ec5252`
- **Config Location**: `/etc/cloudflared/config.yml`

### URLs
- **Production**: https://trainhub.oculogicgroup.com/training/sops
- **Office Apps Dashboard**: https://app.oculogicgroup.com

### Database
- **Supabase URL**: https://arflfrnwnbpnhpghwilk.supabase.co
- **Auth**: Disabled for testing
- **Test User ID**: `00000000-0000-0000-0000-000000000001`

## Source Code

- **Local Path**: `/Users/cmac/workspace`
- **GitHub**: Endeaver-vision/workspace
- **Framework**: Next.js 16 + TypeScript + Tailwind + BlockNote editor

## Recent Changes Made

1. **Removed assetPrefix** from `next.config.ts` - was causing blank screen by pointing to old Vercel URL
2. **Changed default workspace** from UUID to simple string "training" in:
   - `app/(main)/layout.tsx` - line 57
   - `app/dashboard/page.tsx` - redirects to `/training/sops`
3. **Updated "Back to Dashboard"** link in `components/layout/Sidebar.tsx` to point to `app.oculogicgroup.com`

## Deployment Process

```bash
# On local machine
cd /Users/cmac/workspace
git add . && git commit -m "your changes" && git push

# SSH to VPS
ssh root@2.24.194.99

# On VPS
cd /var/www/trainhub
git pull
npm run build
pm2 restart trainhub
```

## Current State

- App is live and working at trainhub.oculogicgroup.com/training/sops
- Navigation between TrainHub and Office Apps dashboard is functional
- URLs no longer have ugly UUID paths

## Task Tracking

This project uses `bd` (beads) for task tracking. Do NOT use TodoWrite.

```bash
bd list          # See current tasks
bd ready         # See available work
bd update <id> --status in_progress  # Start work
bd close <id>    # Complete task
```

Current Epic: `workspace-6nv` - Implement Notion-like features

## Key Files

| File | Purpose |
|------|---------|
| `app/(main)/layout.tsx` | Main layout with sidebar, topnav, AI chat |
| `app/dashboard/page.tsx` | Entry point, redirects to training |
| `components/layout/Sidebar.tsx` | Navigation sidebar |
| `next.config.ts` | Next.js configuration |
| `CLAUDE.md` | Claude instructions for this project |

## Notes

- The workspace system uses simple string "training" instead of UUIDs now
- Office Apps is a separate app at `/Users/cmac/Documents/office-apps-main`
- Both apps share the same Supabase instance
