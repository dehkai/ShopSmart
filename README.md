# ShopSmart

## Project Overview

### Problem Statement

Grocery prices in Malaysia vary significantly across stores, states, and retail chains. Consumers have no easy way to compare prices across hundreds of items and thousands of premises. The PriceCatcher dataset published by the Malaysian government captures this price data, but it is a raw database — not usable directly by a shopper.

The core problem: **a shopper writes a grocery list in natural language, but the database only understands structured item codes**. Bridging that gap (messy text → structured lookup → optimal store) requires AI.

### Target Users

- Malaysian households looking to reduce monthly grocery spending
- Budget-conscious shoppers who want to know which store or state offers the best deal for their specific basket

### System Goal

Given a free-text grocery list, find the single cheapest store (or cheapest store per item) for the entire basket, using real government price data — with no manual item lookup required.

---

## System Architecture

### Data Flow

```
User types grocery list (English / Malay / mixed)
        │
        ▼
[Frontend: Next.js]
        │  POST /api/basket  (proxied to backend)
        ▼
[Backend: FastAPI]
        │
        ├─► [ETL — one-time setup]
        │     Parquet files → clean → SQLite (items, premises, prices)
        │
        ├─► [AI Matcher — src/matcher.py]
        │     LLM maps each grocery line → item_code
        │     Pydantic validates output + item_code checked against DB
        │     rapidfuzz fuzzy match fallback if LLM fails / low confidence
        │
        └─► [Optimizer — src/optimizer.py]
              SQL: cheapest store for full basket
              SQL: cheapest store per item
              SQL: state ranking by average basket total
              SQL: top stores within selected state
        │
        ▼
BasketResult (total, savings, per-item prices, best store, state rankings)
        │
        ▼
[Frontend renders results]
  stat cards · state bar chart · matched items table · per-item price table
```

### Module Breakdown

| Module | Path | Responsibility |
|--------|------|---------------|
| ETL pipeline | `backend/src/etl.py` | Extract → clean → load PriceCatcher data to SQLite |
| AI Matcher | `backend/src/matcher.py` | LLM entity matching + fuzzy fallback |
| LLM abstraction | `backend/src/week_2/prompt_model.py` | Unified interface for Gemini / Ollama |
| Optimizer | `backend/src/optimizer.py` | Price queries, store ranking, savings calculation |
| Pydantic schemas | `backend/src/models.py` | Shared data contracts across all modules |
| FastAPI app | `backend/app.py` | `POST /basket`, `GET /items` |
| Next.js frontend | `frontend/src/app/page.tsx` | Single-page UI: input → results |
| API proxy routes | `frontend/src/app/api/` | Forwards requests to FastAPI, handles 503 gracefully |
| Data fetcher | `scripts/fetch_data.py` | Downloads PriceCatcher parquet files from data.gov.my |

---

## Setup & Installation

### Prerequisites

- Python 3.14
- [uv](https://docs.astral.sh/uv/) 0.8+
- Node.js 18+
- A Gemini API key ([Google AI Studio](https://aistudio.google.com/)) — or run Ollama locally

### 1. Clone

```bash
git clone https://github.com/dehkai/ShopSmart.git
cd ShopSmart
```

### 2. Download the dataset

```bash
python scripts/fetch_data.py
```

Downloads PriceCatcher parquet files into `data/raw/`.

### 3. Build the SQLite database

```bash
cd backend
uv run python -c "from src.etl import run_all; run_all()"
cd ..
```

Creates `data/pricecatcher.db` (~7.5 MB, gitignored).

### 4. Configure backend

```bash
cp backend/.env.example backend/.env
# Set: GEMINI_API=your_key_here
```

### 5. Start the backend

```bash
cd backend
uv run uvicorn app:app --port 8001 --reload
```

### 6. Configure frontend

```bash
cp frontend/.env.example frontend/.env
# BACKEND_URL=http://localhost:8001  ← default, no change needed
```

### 7. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

### Grocery List Input
Accept a free-text grocery list in English, Malay, or mixed. Handles typos, unit suffixes (e.g. `5kg`), and brand variants. No structured input required from the user.

### AI-Powered Item Matching
LLM translates each grocery line to a canonical `item_code` from the PriceCatcher catalog. Returns confidence scores. Items that fail LLM validation are automatically retried with fuzzy string matching (rapidfuzz), so the system degrades gracefully rather than failing.

### Cheapest Store Finder
Given matched item codes, SQL queries find the single store that minimises total basket cost — the "one-stop shop" result. Also computes the theoretical minimum if the user were willing to split across stores (cheapest per item).

### State Filtering
User can optionally pin results to a specific Malaysian state. All optimizer queries respect the state filter at the SQL level.

### State Price Ranking
Bar chart showing average basket total across all states, so users can see regional price differences at a glance.

### Top Stores in State
Within the selected state, ranks stores by how many basket items they stock and their total for those items.

### Savings Calculation
Reports total savings vs. the national average basket price.

### API Key Modal
Users supply their own Gemini API key via an in-app modal. Key is never stored server-side or logged — it is passed per-request.

### Local LLM Fallback
Set `DEV_LLM_PROVIDER=ollama` in `.env` to route all LLM calls to a local Ollama instance. No API key required. Useful for offline development and cost control.

### REST API
`POST /basket` and `GET /items?q=` are fully usable independently (e.g. via curl or Postman), not just through the frontend.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/basket` | Optimize a grocery basket |
| `GET` | `/items?q=` | Search items by name |

### POST /basket — request

```json
{
  "grocery_list": "telur gred A, beras 5kg, minyak masak",
  "state": "Selangor",
  "model": "gemini-2.5-flash-lite",
  "api_key": "YOUR_KEY"
}
```

`state`, `model`, and `api_key` are optional.

### POST /basket — response (BasketResult)

```json
{
  "matches": [...],
  "items": [...],
  "total": 24.50,
  "savings": 3.20,
  "unresolved": []
}
```

---

## Technical Decisions

### LLM for entity matching, not price math
The LLM's job is strictly: *"map this grocery line to an item_code."* All price calculations happen in Python/SQL where results are deterministic and verifiable. This avoids LLM hallucination on arithmetic and keeps the AI component meaningful.

### Three-layer matching (LLM → validation → fuzzy fallback)
LLM output is untrusted by default: the response is parsed as JSON, validated against a Pydantic schema, and each `item_code` is verified against the database. Only then is a match accepted. Low-confidence or invalid results fall back to rapidfuzz token-set-ratio matching. This makes the system robust even when the LLM returns garbage.

### Gemini 2.5 Flash Lite as default model
Fast, cheap, and accurate enough for entity matching on a ~500-item catalog. The model is configurable at runtime — users can switch to a larger Gemini model or use Ollama locally via an environment variable, with no code changes.

### Next.js API routes as proxy
The frontend never calls the FastAPI backend directly from the browser. All requests go through Next.js API routes (`/api/basket`, `/api/items`). This keeps the backend URL server-side only (no CORS configuration needed), handles 503 gracefully, and means the backend port can change without touching frontend code.

### Single-page frontend
The UI has one page that transitions between input view and results view via client-side state (React). No routing needed. This keeps the frontend small and reduces surface area for demo failures.

### Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| LLM for matching only | Deterministic price results | Adds latency (~1-2s) and requires API key |
| rapidfuzz fallback | System never fully fails on bad LLM output | Fuzzy matches may be less accurate than LLM |
| Single-page SPA | Simple, fewer failure points in demo | Less navigable for complex feature sets |
| Gemini Flash Lite | Low cost, fast response | Occasionally misses niche Malay grocery terms |

---

## Limitations

### Known Issues

#### Sequential Latency Bottleneck in Validation Chain

The current matching engine processes validation checks in a strict, single-threaded sequential loop. When evaluating a user query, the system must wait for the LLM to finish entity matching, then sequentially query the database to verify the item code, and finally check the price matrix table. Because each of these operations must wait for the previous one to finish, analyzing complex, multi-item shopping baskets results in compounding latency. This creates an execution bottleneck that scales poorly as the size of the user’s basket grows.

#### Semantic Degradation in Fallback Matching

When the LLM fails validation or returns malformed structures, the system defaults to `rapidfuzz` token-set-ratio matching. While this prevents a total application crash, fuzzy string matching lacks deep contextual awareness. It evaluates semantic proximity solely based on character arrangements, which can occasionally lead to less accurate or completely misaligned item substitutions compared to an LLM’s intent analysis.

#### Localization Tokenization Gaps

To balance speed and operational cost, the system utilizes Gemini 2.5 Flash Lite as its default model. However, this lightweight parameter size introduces a localized data bias. The model occasionally fails to parse or tokenize niche Malay grocery terms and regional shorthand slang, causing the system to frequently drop out of the intelligent LLM layer and trigger the fallback string matcher for regional product catalogs.

#### State-Level Filtering Is Too Coarse

The current geographic filter operates at the state level (e.g. "Selangor"), which still covers hundreds of premises spread across a large area. A shopper in Petaling Jaya and one in Shah Alam are both shown the same result set even though the cheapest store may be an hour's drive away from either of them. Filtering by state narrows the dataset but does not meaningfully answer the practical question: *which nearby store gives me the best price?*

#### Manual ETL Execution

The data pipeline (`fetch_data.py` + `etl.py`) must be triggered manually each time fresh price data is needed. The upstream PriceCatcher dataset is updated daily by the government, but the local SQLite database will silently become stale unless the operator reruns both scripts. There is no automated refresh mechanism.

### Future Improvements

#### Asynchronous Multi-Agent Verification Architecture

Transition the current sequential validation loop into a decoupled, parallel execution pipeline. Introducing a supervisor-specialist multi-agent topology will allow chart analysis, price matrices, and catalog entity verification to run concurrently, reducing the end-to-end latency of complex basket matching.

#### Deterministic Pre-Filtering Layer

Integrate a lightweight database validation layer directly into the initial ingestion sequence. By building an upfront set check, the application can instantly invalidate matching candidates that lack complete or structured pricing profiles before ever passing payloads to the LLM, conserving API tokens and optimizing processing cycles.

#### Localization and Synonym Embeddings Layer

Enhance the fuzzy matching fallback layer by implementing a pre-computed dictionary or a local vector embedding matrix for localized grocery nomenclature. Mapping common bilingual synonyms prior to string comparison will eliminate tokenization gaps for niche terms without requiring a costlier, higher-parameter LLM.

#### Location-Aware Store Recommendations

Replace the state dropdown with browser geolocation (or a postcode input). With the user's coordinates, the optimizer can compute driving distance to each premise and surface the cheapest store within a configurable radius (e.g. 10 km). This turns a broad state-wide result into a genuinely actionable recommendation — the nearest store where the full basket costs the least.

#### Automated Daily ETL via Cron Job

Schedule `fetch_data.py` and the ETL pipeline to run automatically each day, aligned with the PriceCatcher dataset's daily publish cadence. A lightweight cron job (or a cloud scheduler) would pull the latest parquet files, rebuild the SQLite database, and hot-swap the backend's connection so prices stay current without any manual operator intervention.

---

## Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

30 tests covering ETL, matcher (LLM path + fallback path), optimizer, and API endpoints.

## Local LLM (optional)

```bash
# backend/.env
DEV_LLM_PROVIDER=ollama
DEV_OLLAMA_MODEL=llama3.1
```

```bash
ollama pull llama3.1
```