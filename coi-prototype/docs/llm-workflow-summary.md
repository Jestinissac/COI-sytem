# Local LLM Workflow Summary

> Setup completed: 2026-02-08

## What Is Docker?

Docker is a tool that runs applications in **containers** — lightweight, isolated packages that include everything an app needs (code, libraries, settings). Think of it like a shipping container: no matter what's inside, it runs the same way on any machine. Instead of installing Open WebUI directly on your Mac (which could cause dependency conflicts), Docker runs it in its own sealed environment.

## What Is Open WebUI?

Open WebUI is a **ChatGPT-like web interface** that runs locally on your machine. Instead of paying for cloud AI, it connects to your local Ollama models and gives you:
- A clean chat UI in your browser (http://localhost:3100)
- Conversation history and search
- Model switching mid-conversation
- File uploads and RAG (search over your codebase docs)
- Prompt template libraries

It's basically **your own private ChatGPT**, powered by the 166GB of AI models already on your Mac Studio.

---

## What Have We Done & Why?

### The Problem

We have a **large enterprise app** — the **COI (Conflict of Interest) Management System** for Envision PRMS — with ~300 files and ~96K lines of code. The previous setup used Open Interpreter CLI with only 8K context, which was too slow and too limited to analyze the codebase meaningfully.

### The Solution: Local LLM Workflow

We built a complete local AI development workflow on the **Mac Studio M3 Ultra (96GB RAM)**:

| Step | What We Did | Why |
|------|------------|-----|
| **1. Model Aliases** | Created `qwen2.5-coder:32b-32k` and `qwen3-next:32k` | Expanded context from 8K to **32K tokens** — enough to analyze entire files at once, zero extra disk space |
| **2. Context Scripts** | Created 5 scripts in `scripts/` | Automatically generate codebase summaries you can paste into any LLM conversation |
| **3. Context Artifacts** | Generated 4 docs in `docs/llm-context/` | Pre-built snapshots of your file tree, API routes, module signatures, and architecture — ready to feed to the AI |
| **4. Prompt Templates** | Wrote `prompt-templates.md` | Reusable prompts for common tasks: bug analysis, feature planning, code review, architecture questions |
| **5. Open WebUI** | Launched Docker container on port 3100 | A proper chat interface replacing the laggy CLI |

---

## Available Models (166GB total)

| Model | Size | Best For |
|-------|------|----------|
| `qwen2.5-coder:32b` / `32b-32k` | 19 GB | Daily driver — code reading, writing, analysis |
| `qwen3-next:latest` / `32k` | 50 GB | Documentation, architecture explanations |
| `gpt-oss:120b` | 65 GB | Complex business logic reasoning |
| `llama3.1:70b` | 42 GB | General purpose |
| `nomic-embed-text` | 274 MB | Embeddings for RAG search |

The `32k` aliases use the same model weights (zero extra disk space) but with expanded 32,768-token context windows and tuned temperatures for their respective tasks.

---

## How This Helps

The COI system has a complex multi-role approval workflow (Requester -> Director -> Compliance -> Partner -> Finance -> Admin), business rules engines, compliance matrices, ML-based priority scoring, and more. Instead of trying to hold all that in your head, you can now:

1. **Open http://localhost:3100** in your browser
2. **Paste a context artifact** (architecture digest, API routes, etc.)
3. **Ask the AI** to analyze, debug, plan features, or review code
4. **Switch models** depending on the task — fast coder model for quick questions, large model for complex reasoning

Everything runs **locally, privately, for free** — no API costs, no data leaving your machine.

---

## Quick Reference

| Item | Location / Value |
|------|-----------------|
| **Open WebUI** | http://localhost:3100 |
| **Login** | `admin@localhost` / `admin123` |
| **Context docs** | `docs/llm-context/` |
| **Generator scripts** | `scripts/` |
| **Prompt templates** | `docs/llm-context/prompt-templates.md` |

### Re-generate context artifacts

Run these anytime the codebase changes:

```bash
./scripts/generate-tree.sh
./scripts/generate-api-summary.sh
./scripts/generate-module-summaries.sh
./scripts/generate-architecture-digest.sh
```

### Start/Stop Open WebUI

```bash
docker start open-webui    # start
docker stop open-webui     # stop
docker logs open-webui     # check logs
```
