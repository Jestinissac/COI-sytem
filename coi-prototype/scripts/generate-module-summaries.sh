#!/usr/bin/env bash
# Extract imports, exports, and function signatures from every source file.
# Output: docs/llm-context/module-summaries.md

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$REPO_ROOT/docs/llm-context/module-summaries.md"

mkdir -p "$(dirname "$OUTPUT")"

summarize_file() {
  local file="$1"
  local relpath="${file#$REPO_ROOT/}"
  local lines
  lines=$(wc -l < "$file" | tr -d ' ')

  echo "### $relpath ($lines lines)"
  echo ""

  # Imports (require / import statements)
  local imports
  imports=$(grep -nE "^(const|let|var|import)\b.*require\(|^import " "$file" 2>/dev/null | head -20)
  if [ -n "$imports" ]; then
    echo "**Imports:**"
    echo '```'
    echo "$imports"
    echo '```'
    echo ""
  fi

  # Exports
  local exports
  exports=$(grep -nE "^module\.exports|^export (default|const|function|class|{)" "$file" 2>/dev/null | head -20)
  if [ -n "$exports" ]; then
    echo "**Exports:**"
    echo '```'
    echo "$exports"
    echo '```'
    echo ""
  fi

  # Function/class/method signatures
  local sigs
  sigs=$(grep -nE "^(async )?(function |const \w+ = (async )?\(|class |  (async )?\w+\()" "$file" 2>/dev/null \
    | grep -vE "require\(|console\." \
    | head -30)
  if [ -n "$sigs" ]; then
    echo "**Functions / Methods:**"
    echo '```'
    echo "$sigs"
    echo '```'
    echo ""
  fi

  echo "---"
  echo ""
}

{
  echo "# COI Prototype — Module Summaries"
  echo ""
  echo "_Generated on $(date '+%Y-%m-%d %H:%M')_"
  echo ""
  echo "Each section shows a file's imports, exports, and function signatures."
  echo ""

  # --- Backend Controllers ---
  echo "## Backend Controllers"
  echo ""
  for f in "$REPO_ROOT"/backend/src/controllers/*.js "$REPO_ROOT"/backend/src/controllers/*.ts; do
    [ -f "$f" ] && summarize_file "$f"
  done

  # --- Backend Services ---
  echo "## Backend Services"
  echo ""
  for f in "$REPO_ROOT"/backend/src/services/*.js "$REPO_ROOT"/backend/src/services/*.ts; do
    [ -f "$f" ] && summarize_file "$f"
  done

  # --- Backend Routes ---
  echo "## Backend Routes"
  echo ""
  for f in "$REPO_ROOT"/backend/src/routes/*.js "$REPO_ROOT"/backend/src/routes/*.ts; do
    [ -f "$f" ] && summarize_file "$f"
  done

  # --- Backend Middleware ---
  if ls "$REPO_ROOT"/backend/src/middleware/*.js "$REPO_ROOT"/backend/src/middleware/*.ts 2>/dev/null | head -1 >/dev/null; then
    echo "## Backend Middleware"
    echo ""
    for f in "$REPO_ROOT"/backend/src/middleware/*.js "$REPO_ROOT"/backend/src/middleware/*.ts; do
      [ -f "$f" ] && summarize_file "$f"
    done
  fi

  # --- Frontend Stores ---
  echo "## Frontend Stores"
  echo ""
  for f in "$REPO_ROOT"/frontend/src/stores/*.ts "$REPO_ROOT"/frontend/src/stores/*.js; do
    [ -f "$f" ] && summarize_file "$f"
  done

  # --- Frontend Router ---
  echo "## Frontend Router"
  echo ""
  for f in "$REPO_ROOT"/frontend/src/router/*.ts "$REPO_ROOT"/frontend/src/router/*.js; do
    [ -f "$f" ] && summarize_file "$f"
  done

  # --- Frontend Services ---
  if ls "$REPO_ROOT"/frontend/src/services/*.ts "$REPO_ROOT"/frontend/src/services/*.js 2>/dev/null | head -1 >/dev/null; then
    echo "## Frontend Services"
    echo ""
    for f in "$REPO_ROOT"/frontend/src/services/*.ts "$REPO_ROOT"/frontend/src/services/*.js; do
      [ -f "$f" ] && summarize_file "$f"
    done
  fi

  # --- Frontend Composables ---
  if ls "$REPO_ROOT"/frontend/src/composables/*.ts "$REPO_ROOT"/frontend/src/composables/*.js 2>/dev/null | head -1 >/dev/null; then
    echo "## Frontend Composables"
    echo ""
    for f in "$REPO_ROOT"/frontend/src/composables/*.ts "$REPO_ROOT"/frontend/src/composables/*.js; do
      [ -f "$f" ] && summarize_file "$f"
    done
  fi

} > "$OUTPUT"

echo "✓ Module summaries written to $OUTPUT"
echo "  $(wc -l < "$OUTPUT") lines"
