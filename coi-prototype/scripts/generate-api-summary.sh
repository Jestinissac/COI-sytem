#!/usr/bin/env bash
# Extract all API routes with HTTP methods from the COI backend.
# Output: docs/llm-context/api-routes.md

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$REPO_ROOT/docs/llm-context/api-routes.md"
ROUTES_DIR="$REPO_ROOT/backend/src/routes"

mkdir -p "$(dirname "$OUTPUT")"

{
  echo "# COI Prototype — API Routes"
  echo ""
  echo "_Generated on $(date '+%Y-%m-%d %H:%M')_"
  echo ""

  # Extract route mount points from the main entry file
  ENTRY="$REPO_ROOT/backend/src/index.js"
  if [ -f "$ENTRY" ]; then
    echo "## Route Mount Points (from index.js)"
    echo ""
    echo '```'
    grep -n "app\.use\|router\.\|require.*routes\|import.*routes" "$ENTRY" 2>/dev/null \
      | grep -i "route\|api" || echo "(no route mounts found in index.js)"
    echo '```'
    echo ""
  fi

  echo "## Route Definitions by File"
  echo ""

  for route_file in "$ROUTES_DIR"/*.js "$ROUTES_DIR"/*.ts; do
    [ -f "$route_file" ] || continue
    filename="$(basename "$route_file")"
    echo "### $filename"
    echo ""
    echo '```'
    # Extract lines that define routes (GET, POST, PUT, PATCH, DELETE)
    grep -nE "router\.(get|post|put|patch|delete|all)\b|app\.(get|post|put|patch|delete|all)\b" "$route_file" 2>/dev/null \
      | sed 's/^/  /' || echo "  (no standard route definitions found)"
    echo '```'
    echo ""
  done

  # Count totals
  echo "## Summary"
  echo ""
  total_files=$(ls "$ROUTES_DIR"/*.js "$ROUTES_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
  total_routes=$(grep -rlE "router\.(get|post|put|patch|delete)" "$ROUTES_DIR" 2>/dev/null \
    | xargs grep -cE "router\.(get|post|put|patch|delete)" 2>/dev/null \
    | awk -F: '{s+=$2} END {print s}')
  echo "- **Route files:** $total_files"
  echo "- **Total route definitions:** ${total_routes:-0}"

} > "$OUTPUT"

echo "✓ API routes written to $OUTPUT"
echo "  $(wc -l < "$OUTPUT") lines"
