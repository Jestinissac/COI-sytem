#!/usr/bin/env python3
"""
COI Codebase RAG (Retrieval-Augmented Generation) CLI

Embeds codebase files using Ollama's nomic-embed-text model and enables
semantic search + LLM-powered Q&A over the COI prototype codebase.

Usage:
  python scripts/coi-rag.py index          # Build/rebuild the vector index
  python scripts/coi-rag.py search "query" # Search for relevant code chunks
  python scripts/coi-rag.py ask "question" # Ask a question with RAG context

Requirements:
  pip install requests numpy
"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

try:
    import numpy as np
    import requests
except ImportError:
    print("Install dependencies: pip install requests numpy")
    sys.exit(1)

# ── Configuration ──

REPO_ROOT = Path(__file__).resolve().parent.parent
INDEX_DIR = REPO_ROOT / "docs" / "llm-context" / ".rag-index"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text:latest")
CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen2.5-coder:32b-32k")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))
TOP_K = int(os.getenv("TOP_K", "8"))

# File patterns to index
SOURCE_PATTERNS = [
    "backend/src/**/*.js",
    "frontend/src/**/*.ts",
    "frontend/src/**/*.vue",
    "frontend/src/**/*.js",
    "database/schema.sql",
    "database/migrations/*.sql",
    "database/seed/*.js",
    "docs/llm-context/*.md",
]

SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".backup"}


def collect_files() -> list[Path]:
    """Collect all source files matching the patterns."""
    files = []
    for pattern in SOURCE_PATTERNS:
        for f in REPO_ROOT.glob(pattern):
            if not any(skip in f.parts for skip in SKIP_DIRS):
                files.append(f)
    return sorted(set(files))


def chunk_text(text: str, filepath: str) -> list[dict]:
    """Split text into overlapping chunks with metadata."""
    lines = text.split("\n")
    chunks = []
    i = 0
    chunk_idx = 0

    while i < len(lines):
        chunk_lines = lines[i : i + CHUNK_SIZE]
        chunk_text = "\n".join(chunk_lines)
        if chunk_text.strip():
            chunks.append(
                {
                    "file": filepath,
                    "start_line": i + 1,
                    "end_line": i + len(chunk_lines),
                    "text": chunk_text,
                    "chunk_idx": chunk_idx,
                }
            )
            chunk_idx += 1
        # Advance by chunk_size minus overlap (in lines)
        step = max(1, (CHUNK_SIZE - CHUNK_OVERLAP))
        i += step

    return chunks


def get_embedding(text: str) -> list[float]:
    """Get embedding vector from Ollama."""
    resp = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": EMBED_MODEL, "input": text},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    # Ollama returns {"embeddings": [[...]]} for /api/embed
    return data["embeddings"][0]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a_arr = np.array(a)
    b_arr = np.array(b)
    dot = np.dot(a_arr, b_arr)
    norm = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    return float(dot / norm) if norm > 0 else 0.0


def build_index():
    """Index all source files."""
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    files = collect_files()
    print(f"Found {len(files)} files to index")

    all_chunks = []
    all_embeddings = []

    for i, filepath in enumerate(files):
        relpath = str(filepath.relative_to(REPO_ROOT))
        try:
            text = filepath.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            print(f"  Skip {relpath}: {e}")
            continue

        chunks = chunk_text(text, relpath)
        if not chunks:
            continue

        print(f"  [{i+1}/{len(files)}] {relpath} → {len(chunks)} chunks", end="", flush=True)

        for chunk in chunks:
            try:
                header = f"File: {chunk['file']} (lines {chunk['start_line']}-{chunk['end_line']})\n\n"
                emb = get_embedding(header + chunk["text"])
                all_embeddings.append(emb)
                all_chunks.append(chunk)
                print(".", end="", flush=True)
            except Exception as e:
                print(f"\n    Error embedding chunk: {e}")

        print()

    # Save index
    index_data = {"chunks": all_chunks, "config": {"chunk_size": CHUNK_SIZE, "overlap": CHUNK_OVERLAP}}
    with open(INDEX_DIR / "chunks.json", "w") as f:
        json.dump(index_data, f)

    np.save(str(INDEX_DIR / "embeddings.npy"), np.array(all_embeddings))

    print(f"\n✓ Indexed {len(all_chunks)} chunks from {len(files)} files")
    print(f"  Saved to {INDEX_DIR}")


def load_index() -> tuple[list[dict], "np.ndarray"]:
    """Load the saved index."""
    chunks_path = INDEX_DIR / "chunks.json"
    embeddings_path = INDEX_DIR / "embeddings.npy"

    if not chunks_path.exists() or not embeddings_path.exists():
        print("Index not found. Run: python scripts/coi-rag.py index")
        sys.exit(1)

    with open(chunks_path) as f:
        data = json.load(f)

    embeddings = np.load(str(embeddings_path))
    return data["chunks"], embeddings


def search(query: str, top_k: int = TOP_K) -> list[dict]:
    """Search the index for relevant chunks."""
    chunks, embeddings = load_index()
    query_emb = get_embedding(query)

    similarities = []
    for i, emb in enumerate(embeddings):
        sim = cosine_similarity(query_emb, emb.tolist())
        similarities.append((sim, i))

    similarities.sort(reverse=True)
    results = []
    for sim, idx in similarities[:top_k]:
        chunk = chunks[idx].copy()
        chunk["score"] = round(sim, 4)
        results.append(chunk)

    return results


def ask(question: str):
    """Ask a question with RAG context."""
    print(f"Searching for relevant code...\n")
    results = search(question)

    # Build context from top results
    context_parts = []
    for r in results:
        context_parts.append(
            f"--- {r['file']} (lines {r['start_line']}-{r['end_line']}, relevance: {r['score']}) ---\n{r['text']}"
        )
    context = "\n\n".join(context_parts)

    system_prompt = (
        "You are a senior software architect analyzing the COI (Conflict of Interest) Management System.\n"
        "Tech stack: Express.js + better-sqlite3 backend, Vue 3 + Pinia frontend, JWT auth, SQLite.\n"
        "Workflow: Requester -> Director -> Compliance -> Partner -> Finance -> Admin Execution.\n"
        "7 roles: Requester, Director, Compliance, Partner, Finance, Admin, Super Admin.\n"
        "When analyzing code, identify: business domain concept, workflow stage, user roles, "
        "database tables, and dependencies.\n\n"
        "Use the following code context to answer the question. Cite file paths and line numbers."
    )

    prompt = f"## Retrieved Code Context\n\n{context}\n\n## Question\n\n{question}"

    print(f"Asking {CHAT_MODEL}...\n")

    resp = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "stream": True,
        },
        stream=True,
        timeout=300,
    )
    resp.raise_for_status()

    for line in resp.iter_lines():
        if line:
            data = json.loads(line)
            if "message" in data and "content" in data["message"]:
                print(data["message"]["content"], end="", flush=True)
    print()


def main():
    parser = argparse.ArgumentParser(description="COI Codebase RAG CLI")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("index", help="Build/rebuild the vector index")

    search_cmd = sub.add_parser("search", help="Search for relevant code chunks")
    search_cmd.add_argument("query", help="Search query")
    search_cmd.add_argument("-k", type=int, default=TOP_K, help="Number of results")

    ask_cmd = sub.add_parser("ask", help="Ask a question with RAG context")
    ask_cmd.add_argument("question", help="Question to ask")

    args = parser.parse_args()

    if args.command == "index":
        build_index()
    elif args.command == "search":
        results = search(args.query, top_k=args.k)
        for i, r in enumerate(results):
            print(f"\n{'='*60}")
            print(f"[{i+1}] {r['file']}:{r['start_line']}-{r['end_line']} (score: {r['score']})")
            print(f"{'='*60}")
            # Show first 10 lines of chunk
            lines = r["text"].split("\n")[:10]
            print("\n".join(lines))
            if len(r["text"].split("\n")) > 10:
                print(f"  ... ({len(r['text'].split(chr(10)))} lines total)")
    elif args.command == "ask":
        ask(args.question)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
