# News Investigation AI Service

Python / FastAPI / LangChain backend for a mass-communication news investigation tool.

## Architecture

```
Express Gateway (auth, rate-limit)
        │
        │  HTTP (X-Internal-Token)
        ▼
FastAPI AI Service (this service, port 8001)
   ├── /scout    — fetch + normalise from RSS / Guardian / GDELT
   ├── /ingest   — extract → chunk → embed → store
   ├── /compare  — multi-outlet comparison (Gemini structured output)
   ├── /timeline — chronological timeline (Gemini structured output)
   ├── /verify   — fact-check checklist (Google FactCheck API + RAG)
   ├── /ask      — LangGraph ReAct agent (SSE streaming support)
   └── /sources  — source log (JSON or CSV export)
        │
        ├── Chroma (persistent vector store, Gemini embeddings)
        └── MongoDB (articles, claims, source_log, query_cache)
```

## Setup

### 1. Prerequisites

- Python 3.11+
- MongoDB (local or Atlas)
- API Keys (see Environment Variables)

### 2. Install

```bash
cd ai-service
pip install -r requirements.txt
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `INTERNAL_SERVICE_TOKEN` | ✅ | Shared secret with Express gateway |
| `GROQ_API_KEY` | ⚠️ degraded | Groq API key (fast LLM, short tasks) |
| `GEMINI_API_KEY` | ⚠️ degraded | Google Gemini API key (long context + embeddings) |
| `GUARDIAN_API_KEY` | optional | The Guardian Content API |
| `FACTCHECK_API_KEY` | optional | Google Fact Check Tools API |
| `GROQ_MODEL` | optional | Default: `llama-3.3-70b-versatile` |
| `GEMINI_MODEL` | optional | Default: `gemini-1.5-pro-002` |
| `GEMINI_EMBEDDING_MODEL` | optional | Default: `models/text-embedding-004` |
| `CHROMA_DIR` | optional | Default: `./chroma_data` |
| `LOG_LEVEL` | optional | Default: `INFO` |
| `HTTP_TIMEOUT` | optional | Default: `20` seconds |

> **Security**: `.env` must never be committed. The service checks this on startup and exits if `.env` is not in `.gitignore`.

### 4. Run

```bash
# Development
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or
python -m app.main
```

### 5. Production (VPS with systemd)

Create `/etc/systemd/system/ai-service.service`:

```ini
[Unit]
Description=News Investigation AI Service
After=network.target

[Service]
User=newsbot
WorkingDirectory=/opt/news-investigator/ai-service
EnvironmentFile=/opt/news-investigator/ai-service/.env
ExecStart=/opt/news-investigator/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Secure the env file
chmod 600 /opt/news-investigator/ai-service/.env
chown newsbot:newsbot /opt/news-investigator/ai-service/.env

sudo systemctl enable ai-service
sudo systemctl start ai-service
```

## API Reference

All endpoints (except `/health`) require the header:
```
X-Internal-Token: <INTERNAL_SERVICE_TOKEN>
```

---

### `GET /health`

No auth required.

```bash
curl http://localhost:8001/health
```

```json
{
  "status": "ok",
  "groq_available": true,
  "gemini_available": true,
  "mongodb_connected": true,
  "vector_store_ready": true
}
```

---

### `POST /scout`

Fetch articles from multiple news sources.

```bash
curl -X POST http://localhost:8001/scout \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ceasefire negotiations Gaza",
    "country": "us",
    "sources": ["guardian", "gdelt", "rss:bbc"],
    "limit": 15
  }'
```

Response: array of `Article` objects.

---

### `POST /ingest`

Ingest articles into the knowledge base for an investigation.

```bash
# From URLs
curl -X POST http://localhost:8001/ingest \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investigation_id": "inv_001",
    "urls": [
      "https://www.theguardian.com/world/2024/...",
      "https://www.bbc.com/news/world/..."
    ]
  }'
```

```json
{ "new": 2, "duplicate": 0, "partial": 0, "failed": 0 }
```

---

### `POST /compare`

Compare how outlets covered an event (structured Gemini output).

```bash
curl -X POST http://localhost:8001/compare \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investigation_id": "inv_001",
    "event_query": "hospital airstrike October 2024"
  }'
```

Response: `Comparison` object with per-outlet coverage, agreements, disagreements, single-source flags.

---

### `POST /timeline`

Build a chronological timeline.

```bash
curl -X POST http://localhost:8001/timeline \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investigation_id": "inv_001",
    "story_query": "ceasefire negotiations 2024"
  }'
```

Response: `Timeline` with dated events and source citations.

---

### `POST /verify`

Fact-check a claim (produces a checklist — the AI does NOT give a verdict).

```bash
curl -X POST http://localhost:8001/verify \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "claim": "The strike killed 500 civilians",
    "investigation_id": "inv_001"
  }'
```

Response: `VerifyResult` with fact-check hits, verification checklist, related sources.

---

### `POST /ask`

Ask a grounded question (answered only from ingested sources).

```bash
# JSON response
curl -X POST http://localhost:8001/ask \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investigation_id": "inv_001",
    "question": "Which outlet first reported the ceasefire proposal?",
    "stream": false
  }'

# SSE streaming
curl -X POST http://localhost:8001/ask \
  -H "X-Internal-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "investigation_id": "inv_001",
    "question": "Summarise the key events of the past week.",
    "stream": true
  }'
```

---

### `GET /sources/{investigation_id}`

Get the source log.

```bash
# JSON
curl http://localhost:8001/sources/inv_001 \
  -H "X-Internal-Token: $TOKEN"

# CSV export (for academic citation tracking)
curl http://localhost:8001/sources/inv_001?format=csv \
  -H "X-Internal-Token: $TOKEN" \
  -o sources_inv_001.csv
```

---

## Tests

```bash
cd ai-service
pytest -v
```

No real API keys are needed — all external calls are mocked.

## LLM Routing Logic

| Task | Preferred Provider | Threshold |
|---|---|---|
| classify, entity_extract, headline_clean, route | Groq (fast) | — |
| summarize, compare, timeline, verify, ask | Gemini (long context) | — |
| Any task with estimated tokens > `LONG_CONTEXT_TOKEN_THRESHOLD` | Gemini | default 3000 |

Both providers are chained with `.with_fallbacks()` so a rate-limit on one silently falls through to the other.

## Grounding Rules

The AI service is strictly grounded:
- **Never answers from training data about current events.**
- Every factual claim must cite `[Outlet, Date](URL)`.
- Single-source stories, press-release rewrites, and source conflicts are flagged automatically.
- `/verify` produces a verification _checklist_ only — no verdict. The student does the verification.

## Files Created

| File | Purpose |
|---|---|
| `app/main.py` | FastAPI app, startup checks, router mounting |
| `app/config.py` | Pydantic-settings, SecretStr keys, availability flags |
| `app/auth.py` | Constant-time internal token check |
| `app/schemas.py` | All Pydantic v2 request/response models |
| `app/prompts.py` | Grounding system prompt + per-mode prompts |
| `app/llm.py` | Groq/Gemini factory, routing, fallbacks |
| `app/embeddings.py` | Gemini embeddings factory |
| `app/db.py` | MongoDB client, collection helpers, indexes |
| `app/agent.py` | LangGraph ReAct agent (no AgentExecutor) |
| `app/rag/store.py` | Chroma init, per-investigation collections |
| `app/rag/ingest.py` | Ingest pipeline (fetch → dedupe → extract → chunk → embed) |
| `app/rag/retriever.py` | Similarity search with metadata filters + citations |
| `app/tools/rss.py` | RSS feed fetcher (feedparser + httpx) |
| `app/tools/guardian.py` | Guardian Content API client |
| `app/tools/gdelt.py` | GDELT article search |
| `app/tools/factcheck.py` | Google Fact Check Tools API |
| `app/tools/wayback.py` | Wayback Machine availability + first-snapshot |
| `app/tools/article.py` | Single-article fetch + trafilatura extraction |
| `app/routers/health.py` | GET /health |
| `app/routers/scout.py` | POST /scout |
| `app/routers/ingest.py` | POST /ingest |
| `app/routers/compare.py` | POST /compare |
| `app/routers/timeline.py` | POST /timeline |
| `app/routers/verify.py` | POST /verify |
| `app/routers/ask.py` | POST /ask (JSON + SSE) |
| `app/routers/sources.py` | GET /sources/{id} (JSON + CSV) |
| `tests/conftest.py` | Shared fixtures, mocked deps |
| `tests/test_auth.py` | Token auth tests |
| `tests/test_config.py` | Secret safety, degraded-mode tests |
| `tests/test_ingest.py` | Idempotency tests |
| `tests/test_retrieval.py` | Retrieval metadata tests |
| `tests/test_llm_router.py` | Routing and fallback tests |
| `tests/test_health.py` | Health endpoint tests |

