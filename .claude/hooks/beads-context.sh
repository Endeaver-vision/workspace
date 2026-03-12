#!/bin/bash
# Restore beads context after compaction or session resume

export PATH="$PATH:/Users/cmac/.local/bin"

cat <<'EOF'
## TASK TRACKING: USE BEADS (bd)

This project uses `bd` (beads) for persistent task tracking. Do NOT use TodoWrite.

Commands:
- `bd list` - See all tasks
- `bd ready` - Tasks with no blockers
- `bd update <id> --status in_progress` - Start task
- `bd update <id> --status closed` - Complete task

EOF

echo "### Current Tasks:"
echo '```'
bd list 2>/dev/null || echo "Run: export PATH=\$PATH:/Users/cmac/.local/bin && bd list"
echo '```'

exit 0
