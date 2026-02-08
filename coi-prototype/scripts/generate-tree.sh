#!/usr/bin/env bash
# Generate a clean file tree of all source files in the COI codebase.
# Output: docs/llm-context/file-tree.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$REPO_ROOT/docs/llm-context/file-tree.md"

mkdir -p "$(dirname "$OUTPUT")"

{
  echo "# COI Prototype — File Tree"
  echo ""
  echo "_Generated on $(date '+%Y-%m-%d %H:%M')_"
  echo ""

  # --- Backend ---
  echo "## Backend (backend/src/)"
  echo ""
  echo '```'
  (cd "$REPO_ROOT" && find backend/src \
    -type f \
    \( -name '*.js' -o -name '*.ts' -o -name '*.json' \) \
    ! -path '*/node_modules/*' \
    | sort)
  echo '```'
  echo ""

  # --- Frontend ---
  echo "## Frontend (frontend/src/)"
  echo ""
  echo '```'
  (cd "$REPO_ROOT" && find frontend/src \
    -type f \
    \( -name '*.vue' -o -name '*.ts' -o -name '*.js' -o -name '*.css' \) \
    ! -path '*/node_modules/*' \
    | sort)
  echo '```'
  echo ""

  # --- Database ---
  echo "## Database (database/)"
  echo ""
  echo '```'
  (cd "$REPO_ROOT" && find database \
    -type f \
    \( -name '*.sql' -o -name '*.js' \) \
    ! -path '*/node_modules/*' \
    | sort)
  echo '```'
  echo ""

  # --- Client Intelligence ---
  if [ -d "$REPO_ROOT/client-intelligence" ]; then
    echo "## Client Intelligence (client-intelligence/)"
    echo ""
    echo '```'
    (cd "$REPO_ROOT" && find client-intelligence \
      -type f \
      \( -name '*.js' -o -name '*.ts' -o -name '*.vue' \) \
      ! -path '*/node_modules/*' \
      | sort)
    echo '```'
    echo ""
  fi

  # --- E2E Tests ---
  if [ -d "$REPO_ROOT/e2e" ]; then
    echo "## E2E Tests (e2e/)"
    echo ""
    echo '```'
    (cd "$REPO_ROOT" && find e2e \
      -type f \
      \( -name '*.ts' -o -name '*.js' \) \
      ! -path '*/node_modules/*' \
      | sort)
    echo '```'
    echo ""
  fi

  # --- Root config files ---
  echo "## Root Configuration Files"
  echo ""
  echo '```'
  (cd "$REPO_ROOT" && ls -1 \
    package.json \
    playwright.config.ts \
    2>/dev/null || true)
  echo '```'

} > "$OUTPUT"

echo "✓ File tree written to $OUTPUT"
echo "  $(wc -l < "$OUTPUT") lines"
