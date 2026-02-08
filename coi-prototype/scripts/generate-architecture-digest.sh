#!/usr/bin/env bash
# Generate a single-file architecture overview of the COI codebase.
# Combines: schema info, module list, route mounts, and business context.
# Output: docs/llm-context/architecture-digest.md

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$REPO_ROOT/docs/llm-context/architecture-digest.md"
SCHEMA="$REPO_ROOT/database/schema.sql"

mkdir -p "$(dirname "$OUTPUT")"

{
  echo "# COI Prototype — Architecture Digest"
  echo ""
  echo "_Generated on $(date '+%Y-%m-%d %H:%M')_"
  echo ""

  # ── Business Context ──
  cat <<'CONTEXT'
## Business Context

The COI (Conflict of Interest) Management System is part of the Envision PRMS
(Practice & Risk Management System). It manages the lifecycle of conflict-of-interest
checks for professional services engagements.

**Workflow stages:**
Requester → Director → Compliance → Partner → Finance → Admin Execution

**User roles (7):**
Requester, Director, Compliance, Partner, Finance, Admin, Super Admin

**Core domain concepts:**
- **COI Requests:** Conflict checks initiated by a Requester for a client engagement
- **Engagements:** Client engagements that require COI clearance
- **Compliance Rules:** IESBA, CMA, and firm-specific business rules
- **Approvals:** Multi-stage approval workflow with role-based gates
- **Service Catalog:** Categorized list of professional services offered

CONTEXT

  # ── Tech Stack ──
  echo "## Tech Stack"
  echo ""
  echo "| Layer | Technology |"
  echo "|---|---|"
  echo "| Backend | Node.js + Express.js |"
  echo "| Database | SQLite via better-sqlite3 |"
  echo "| Frontend | Vue 3 + Vite + TypeScript |"
  echo "| State | Pinia stores |"
  echo "| Styling | Tailwind CSS |"
  echo "| Auth | JWT (jsonwebtoken + bcryptjs) |"
  echo "| Testing | Vitest (unit) + Playwright (E2E) |"
  echo "| Exports | ExcelJS, PDFKit |"
  echo ""

  # ── Database Tables ──
  echo "## Database Tables (from schema.sql)"
  echo ""
  if [ -f "$SCHEMA" ]; then
    echo '```'
    grep -E "^CREATE TABLE" "$SCHEMA" | sed 's/CREATE TABLE IF NOT EXISTS //' | sed 's/CREATE TABLE //' | sed 's/ (//' | sort
    echo '```'
    echo ""
    table_count=$(grep -cE "^CREATE TABLE" "$SCHEMA" 2>/dev/null || echo 0)
    schema_lines=$(wc -l < "$SCHEMA" | tr -d ' ')
    echo "**$table_count tables, $schema_lines lines in schema.sql**"
  else
    echo "(schema.sql not found at $SCHEMA)"
  fi
  echo ""

  # ── Backend Module Map ──
  echo "## Backend Modules"
  echo ""
  echo "### Controllers (backend/src/controllers/)"
  echo '```'
  ls -1 "$REPO_ROOT/backend/src/controllers/"*.js 2>/dev/null | xargs -I{} basename {} | sort
  echo '```'
  echo ""
  echo "### Services (backend/src/services/)"
  echo '```'
  ls -1 "$REPO_ROOT/backend/src/services/"*.js 2>/dev/null | xargs -I{} basename {} | sort
  echo '```'
  echo ""
  echo "### Routes (backend/src/routes/)"
  echo '```'
  ls -1 "$REPO_ROOT/backend/src/routes/"*.js 2>/dev/null | xargs -I{} basename {} | sort
  echo '```'
  echo ""

  # ── Route Mounts ──
  ENTRY="$REPO_ROOT/backend/src/index.js"
  if [ -f "$ENTRY" ]; then
    echo "## Route Mounts (from backend/src/index.js)"
    echo ""
    echo '```'
    grep -nE "app\.use\(" "$ENTRY" | grep -iE "route|api|/api" || echo "(none found)"
    echo '```'
    echo ""
  fi

  # ── Middleware ──
  if ls "$REPO_ROOT"/backend/src/middleware/*.js 2>/dev/null | head -1 >/dev/null; then
    echo "## Middleware"
    echo '```'
    ls -1 "$REPO_ROOT/backend/src/middleware/"*.js 2>/dev/null | xargs -I{} basename {} | sort
    echo '```'
    echo ""
  fi

  # ── Frontend Module Map ──
  echo "## Frontend Modules"
  echo ""
  echo "### Pinia Stores (frontend/src/stores/)"
  echo '```'
  ls -1 "$REPO_ROOT/frontend/src/stores/"*.ts 2>/dev/null | xargs -I{} basename {} | sort
  echo '```'
  echo ""

  echo "### Views (frontend/src/views/)"
  echo '```'
  ls -1 "$REPO_ROOT/frontend/src/views/"*.vue 2>/dev/null | xargs -I{} basename {} | sort
  echo '```'
  echo ""

  echo "### Component Directories (frontend/src/components/)"
  echo '```'
  (cd "$REPO_ROOT/frontend/src/components" && find . -type d | sort | sed 's|^\./||' | grep -v '^\.$')
  echo '```'
  echo ""

  # ── Key Business Logic Files ──
  echo "## Key Business Logic Files"
  echo ""
  echo "| File | Purpose |"
  echo "|---|---|"

  for f in \
    "backend/src/services/businessRulesEngine.js|Core rules engine for conflict evaluation" \
    "backend/src/services/iesbaDecisionMatrix.js|IESBA ethics standard decision matrix" \
    "backend/src/services/cmaConflictMatrix.js|CMA conflict detection matrix" \
    "backend/src/services/engagementCodeService.js|Engagement code generation logic" \
    "backend/src/services/emailService.js|Email notification service" \
    "backend/src/services/notificationService.js|In-app notification service" \
    "backend/src/services/auditTrailService.js|Audit trail / history tracking" \
    "backend/src/services/permissionService.js|Role-based permission checks" \
    "backend/src/services/slaService.js|SLA monitoring and tracking" \
    "backend/src/services/priorityService.js|Request priority calculation" \
    "backend/src/controllers/coiController.js|Main COI request CRUD operations" \
    "backend/src/controllers/complianceController.js|Compliance review operations" \
    "backend/src/controllers/engagementController.js|Engagement management operations"
  do
    filepath="${f%%|*}"
    desc="${f#*|}"
    if [ -f "$REPO_ROOT/$filepath" ]; then
      lines=$(wc -l < "$REPO_ROOT/$filepath" | tr -d ' ')
      echo "| \`$filepath\` ($lines lines) | $desc |"
    fi
  done
  echo ""

  # ── Database Seeds ──
  echo "## Database Seeds (backend/src/scripts/ + database/seed/)"
  echo '```'
  ls -1 "$REPO_ROOT/backend/src/scripts/"*.js 2>/dev/null | xargs -I{} basename {} | sort
  ls -1 "$REPO_ROOT/database/seed/"*.js 2>/dev/null | xargs -I{} basename {} | sort
  echo '```'
  echo ""

  # ── File Counts ──
  echo "## File Counts"
  echo ""
  echo "| Category | Count |"
  echo "|---|---|"

  count_files() {
    find "$1" -type f -name "$2" ! -path '*/node_modules/*' 2>/dev/null | wc -l | tr -d ' '
  }

  echo "| Backend Controllers | $(count_files "$REPO_ROOT/backend/src/controllers" '*.js') |"
  echo "| Backend Services | $(count_files "$REPO_ROOT/backend/src/services" '*.js') |"
  echo "| Backend Routes | $(count_files "$REPO_ROOT/backend/src/routes" '*.js') |"
  echo "| Frontend Components (.vue) | $(count_files "$REPO_ROOT/frontend/src/components" '*.vue') |"
  echo "| Frontend Views (.vue) | $(count_files "$REPO_ROOT/frontend/src/views" '*.vue') |"
  echo "| Frontend Stores | $(count_files "$REPO_ROOT/frontend/src/stores" '*.ts') |"
  echo "| Database Migrations | $(count_files "$REPO_ROOT/database/migrations" '*.sql') |"
  echo "| E2E Tests | $(count_files "$REPO_ROOT/e2e" '*.ts') |"
  echo ""

  total_backend=$(find "$REPO_ROOT/backend/src" -type f \( -name '*.js' -o -name '*.ts' \) ! -path '*/node_modules/*' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
  total_frontend=$(find "$REPO_ROOT/frontend/src" -type f \( -name '*.vue' -o -name '*.ts' -o -name '*.js' \) ! -path '*/node_modules/*' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

  echo "**Total backend lines:** ${total_backend:-unknown}"
  echo "**Total frontend lines:** ${total_frontend:-unknown}"

} > "$OUTPUT"

echo "✓ Architecture digest written to $OUTPUT"
echo "  $(wc -l < "$OUTPUT") lines"
