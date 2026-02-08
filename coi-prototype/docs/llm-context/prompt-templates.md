# COI Prototype — LLM Prompt Templates & Workflow Guide

_For use with Open WebUI + Ollama local models_

---

## System Prompt (set per-model in Open WebUI Settings → Models)

```
You are a senior software architect analyzing the COI (Conflict of Interest) Management System.
Tech stack: Express.js + better-sqlite3 backend, Vue 3 + Pinia frontend, JWT auth, SQLite.
Workflow: Requester -> Director -> Compliance -> Partner -> Finance -> Admin Execution.
7 roles: Requester, Director, Compliance, Partner, Finance, Admin, Super Admin.
When analyzing code, identify: business domain concept, workflow stage, user roles, database tables, and dependencies.
```

---

## Model Selection Guide

| Task | Model | Why |
|---|---|---|
| Daily code reading/writing | `qwen2.5-coder:32b-32k` | Optimized for code, fast enough for iteration |
| Documentation generation | `qwen3-next:32k` | Better prose, structured output |
| Complex business logic reasoning | `gpt-oss:120b` | Deepest reasoning, use sparingly (slow) |
| Embedding for RAG | `nomic-embed-text` | Lightweight, runs alongside other models |

---

## Prompt Template 1: Architecture Understanding

**Model:** `qwen3-next:32k`
**Context file:** Paste `architecture-digest.md`

```
I've pasted the architecture digest for our COI Management System below.

Please provide:
1. A data flow diagram (in Mermaid syntax) showing how a COI request moves through the system
2. The key integration points between frontend and backend
3. Which services are involved at each workflow stage (Requester → Director → Compliance → Partner → Finance → Admin)
4. Any architectural concerns or coupling issues you notice

[paste architecture-digest.md here]
```

---

## Prompt Template 2: Module Deep-Dive

**Model:** `qwen2.5-coder:32b-32k`
**Context file:** Paste the specific source file

```
Analyze this module from our COI Management System. Provide:

1. **Purpose:** One-sentence summary of what this module does
2. **Function table:** List every exported function with its parameters, return type, and one-line description
3. **Dependencies:** What other modules/services does this import and why
4. **Database tables:** Which tables does this module read from or write to
5. **Workflow stage:** Which stage(s) of the approval workflow does this relate to
6. **Business rules:** Any validation, permission checks, or business logic embedded here

[paste source file here]
```

---

## Prompt Template 3: Code Modification

**Model:** `qwen2.5-coder:32b-32k`
**Context files:** Paste `architecture-digest.md` + the target file(s)

```
I need to make the following change to our COI system:

**Change requested:** [describe what you want to change]

**Architecture context:**
[paste architecture-digest.md]

**Files to modify:**
[paste the target source files]

Please provide:
1. Which files need to change and why
2. The specific code changes (as diffs or complete replacement functions)
3. Any other files that might be affected (ripple effects)
4. Database migration needed? (yes/no + SQL if yes)
5. Frontend changes needed? (yes/no + which components)
6. Test cases that should be added or updated
```

---

## Prompt Template 4: Onboarding Documentation

**Model:** `qwen3-next:32k`
**Context files:** Paste all 4 context artifacts

```
Using the codebase context below, write a developer onboarding guide for a new developer joining the COI project. Include:

1. **System overview** — what the system does, who uses it, the approval workflow
2. **Tech stack** — frameworks, libraries, database, build tools
3. **Project structure** — where to find what (backend, frontend, database, tests)
4. **Key patterns** — how routes/controllers/services connect, how auth works, how state is managed
5. **Development workflow** — how to run the app locally, run tests, add a new feature
6. **Important business concepts** — COI workflow stages, roles, compliance rules
7. **Common tasks** — adding a new API endpoint, adding a new page, modifying a workflow step

Context files:
[paste file-tree.md]
[paste architecture-digest.md]
[paste api-routes.md]
[paste module-summaries.md]
```

---

## Prompt Template 5: Database Analysis

**Model:** `qwen2.5-coder:32b-32k`
**Context file:** Paste `database/schema.sql`

```
Analyze this SQLite schema for our COI (Conflict of Interest) Management System. Provide:

1. **Table inventory:** List all tables grouped by domain (auth, COI workflow, compliance, engagement, reporting, etc.)
2. **ER diagram:** Mermaid syntax showing relationships between tables (foreign keys, logical relationships)
3. **Key relationships:** Explain the most important table relationships and what they represent in the business domain
4. **Workflow tables:** Which tables track the approval workflow stages and how
5. **Audit/history:** How is change tracking implemented
6. **Indexes:** Are there adequate indexes for the query patterns implied by the schema
7. **Potential issues:** Any schema design concerns (missing constraints, denormalization, etc.)

[paste schema.sql here]
```

---

## Open WebUI RAG Setup (Step 5)

### Configure Embedding Model

1. Open `http://localhost:3100`
2. Go to **Admin Panel** (gear icon) → **Settings** → **Documents**
3. Set:
   - **Embedding Model Engine:** Ollama
   - **Embedding Model:** `nomic-embed-text:latest`
   - **Chunk Size:** 1500
   - **Chunk Overlap:** 200
4. Save

### Create Knowledge Base

1. Go to **Workspace** → **Knowledge**
2. Click **Create** → name it **"COI Codebase"**
3. Upload these files in order:
   - `docs/llm-context/architecture-digest.md`
   - `docs/llm-context/file-tree.md`
   - `docs/llm-context/api-routes.md`
   - `docs/llm-context/module-summaries.md`
   - `database/schema.sql`
   - All 23 route files from `backend/src/routes/`
   - All 36 service files from `backend/src/services/`
   - All 27 controller files from `backend/src/controllers/`
   - All 6 Pinia store files from `frontend/src/stores/`
   - `frontend/src/router/index.ts`
4. Wait for embedding to complete (watch the progress indicator)

### Using RAG in Chat

- Start a new chat, click the **+** button → attach the **COI Codebase** knowledge base
- The model will automatically retrieve relevant code chunks when you ask questions
- Works best with questions like:
  - "How does engagement code generation work?"
  - "What happens when a COI request is submitted?"
  - "Which files handle the compliance review stage?"

---

## Systematic Understanding Sessions (Step 6)

Work through these in order, one conversation per session. Save outputs to `docs/llm-context/`.

### Session 1: Schema & Data Model
- **Model:** `qwen2.5-coder:32b-32k`
- **Paste:** `database/schema.sql`
- **Prompt:** Use Template 5 (Database Analysis)
- **Save output as:** `docs/llm-context/session-1-schema-analysis.md`

### Session 2: Backend Architecture
- **Model:** `qwen2.5-coder:32b-32k`
- **Paste:** `architecture-digest.md` + `api-routes.md`
- **Prompt:** Use Template 1 (Architecture Understanding)
- **Save output as:** `docs/llm-context/session-2-backend-architecture.md`

### Session 3: Frontend Architecture
- **Model:** `qwen2.5-coder:32b-32k`
- **Paste:** `frontend/src/router/index.ts` + all 6 Pinia stores
- **Ask:** "Map the frontend routing structure, explain how each store manages state, and show how views connect to API calls"
- **Save output as:** `docs/llm-context/session-3-frontend-architecture.md`

### Session 4: Business Rules
- **Model:** `gpt-oss:120b` (use the big model for this one)
- **Paste:** `businessRulesEngine.js` + `iesbaDecisionMatrix.js` + `cmaConflictMatrix.js`
- **Ask:** "Explain the complete compliance rule evaluation logic. What inputs does it take, what decisions does it make, and what are all the possible outcomes?"
- **Save output as:** `docs/llm-context/session-4-business-rules.md`

### Session 5: Cross-Module Dependencies
- **Model:** `qwen2.5-coder:32b-32k`
- **Paste:** `module-summaries.md`
- **Ask:** "Create a dependency graph showing which modules depend on which other modules. Identify any circular dependencies or tightly coupled clusters."
- **Save output as:** `docs/llm-context/session-5-dependencies.md`

---

## CLI RAG Alternative

If you prefer the terminal over Open WebUI for quick searches:

```bash
# First time: build the index (indexes all source files)
python scripts/coi-rag.py index

# Search for relevant code chunks
python scripts/coi-rag.py search "engagement code generation"

# Ask a question with automatic context retrieval
python scripts/coi-rag.py ask "How does the approval workflow handle rejected requests?"
```

Environment variables:
- `OLLAMA_URL` — Ollama API URL (default: `http://localhost:11434`)
- `EMBED_MODEL` — Embedding model (default: `nomic-embed-text:latest`)
- `CHAT_MODEL` — Chat model (default: `qwen2.5-coder:32b-32k`)
- `CHUNK_SIZE` — Lines per chunk (default: `1500`)
- `TOP_K` — Number of results (default: `8`)
