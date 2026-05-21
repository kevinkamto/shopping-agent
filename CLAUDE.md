# CLAUDE.md — Multi-Agent Shopping Assistant Portfolio

> AI-powered shopping assistant built with a multi-agent architecture.  
> Backend: FastAPI · Frontend: Next.js + shadcn/ui · LLMs: OpenAI · Search: Tavily

---

## Project Overview

This project demonstrates a production-grade **multi-agent shopping assistant** as a portfolio piece.
Users describe what they want to buy; a network of specialized AI agents collaborates to research,
compare, and recommend products with real-time web data.

### Agent Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────┐
│                  Orchestrator Agent                  │
│  (GPT-4o · routes tasks, aggregates results)        │
└──────┬──────────┬───────────────┬───────────────────┘
       │          │               │
       ▼          ▼               ▼
 ┌──────────┐ ┌──────────┐ ┌──────────────┐
 │  Search  │ │ Analysis │ │ Recommender  │
 │  Agent   │ │  Agent   │ │    Agent     │
 │ (Tavily) │ │ (GPT-4o) │ │  (GPT-4o)   │
 └──────────┘ └──────────┘ └──────────────┘
       │          │               │
       └──────────┴───────────────┘
                  │
                  ▼
          Structured Response
         (products + reasoning)
```

**Agents:**
- **Orchestrator** — decomposes queries, fans out tasks, merges results
- **Search Agent** — real-time product search via Tavily API
- **Analysis Agent** — extracts specs, price, pros/cons from raw results
- **Recommender Agent** — ranks products and generates user-facing justification

---

## Repository Structure

```
shopping-assistant/
├── CLAUDE.md                  ← you are here
├── backend/
│   ├── pyproject.toml         ← uv project config (no pip)
│   ├── uv.lock
│   ├── ruff.toml
│   ├── mypy.ini
│   └── app/
│       ├── main.py            ← FastAPI entry point
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── orchestrator.py
│       │   ├── search_agent.py
│       │   ├── analysis_agent.py
│       │   └── recommender_agent.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── request.py     ← Pydantic input models
│       │   └── response.py    ← Pydantic output models
│       ├── services/
│       │   ├── openai_client.py
│       │   └── tavily_client.py
│       ├── api/
│       │   └── routes.py
│       └── config.py          ← settings via pydantic-settings
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── components.json        ← shadcn/ui config
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx       ← hero / landing
        │   └── chat/
        │       └── page.tsx   ← main chat interface
        ├── components/
        │   ├── ui/            ← shadcn primitives (auto-generated)
        │   ├── chat/
        │   │   ├── ChatInput.tsx
        │   │   ├── MessageBubble.tsx
        │   │   └── AgentStatusStream.tsx
        │   ├── products/
        │   │   ├── ProductCard.tsx
        │   │   ├── ProductGrid.tsx
        │   │   └── CompareTable.tsx
        │   └── layout/
        │       ├── Header.tsx
        │       └── AgentTimeline.tsx
        ├── lib/
        │   ├── api.ts         ← typed fetch wrappers
        │   └── utils.ts       ← cn() and helpers
        ├── hooks/
        │   └── useShoppingStream.ts
        └── types/
            └── index.ts
```

---

## Backend

### Tech Stack

| Tool | Purpose |
|------|---------|
| FastAPI | Async REST + SSE streaming |
| Pydantic v2 | Request/response models, settings |
| OpenAI Python SDK | GPT-4o for all agents |
| Tavily Python SDK | Real-time product search |
| uv | Package management (replaces pip) |
| ruff | Linter + formatter |
| mypy | Static type checking |
| uvicorn | ASGI server |

### Setup

```bash
# Install uv (once)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project and sync deps
cd backend
uv sync

# Set env vars (or copy .env.example → .env)
export OPENAI_API_KEY="sk-..."
export TAVILY_API_KEY="tvly-..."

# Run dev server
uv run uvicorn app.main:app --reload --port 8000
```

### pyproject.toml (backend)

```toml
[project]
name = "shopping-assistant-backend"
version = "0.1.0"
requires-python = ">=3.12"

dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "pydantic>=2.9",
    "pydantic-settings>=2.6",
    "openai>=1.54",
    "tavily-python>=0.5",
    "httpx>=0.27",
    "sse-starlette>=2.1",
]

[tool.uv]
dev-dependencies = [
    "ruff>=0.8",
    "mypy>=1.13",
    "pytest>=8.3",
    "pytest-asyncio>=0.24",
    "httpx>=0.27",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM", "ANN"]
ignore = ["ANN101", "ANN102"]

[tool.mypy]
strict = true
python_version = "3.12"
```

### Linting & Type Checking

```bash
# Lint + format
uv run ruff check . --fix
uv run ruff format .

# Type check
uv run mypy app/

# Run all checks (CI-ready)
uv run ruff check . && uv run ruff format --check . && uv run mypy app/
```

### Core Files

**`app/config.py`**
```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str
    tavily_api_key: str
    openai_model: str = "gpt-4o"
    max_search_results: int = 5
    agent_timeout_seconds: int = 30


settings = Settings()  # type: ignore[call-arg]
```

**`app/models/request.py`**
```python
from pydantic import BaseModel, Field


class ShoppingRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    budget: float | None = Field(None, gt=0)
    currency: str = Field("USD", pattern="^[A-Z]{3}$")
    max_results: int = Field(5, ge=1, le=10)
```

**`app/models/response.py`**
```python
from pydantic import BaseModel


class Product(BaseModel):
    title: str
    price: str
    url: str
    pros: list[str]
    cons: list[str]
    score: float
    reasoning: str


class ShoppingResponse(BaseModel):
    query: str
    products: list[Product]
    summary: str
    search_queries_used: list[str]
    agent_trace: list[str]
```

**`app/agents/orchestrator.py`**
```python
import asyncio
from app.agents.search_agent import SearchAgent
from app.agents.analysis_agent import AnalysisAgent
from app.agents.recommender_agent import RecommenderAgent
from app.models.request import ShoppingRequest
from app.models.response import ShoppingResponse


class OrchestratorAgent:
    def __init__(self) -> None:
        self.search = SearchAgent()
        self.analysis = AnalysisAgent()
        self.recommender = RecommenderAgent()

    async def run(self, req: ShoppingRequest) -> ShoppingResponse:
        # 1. Fan out search queries in parallel
        raw_results = await self.search.run(req.query, req.max_results)

        # 2. Analyse results concurrently
        analyses = await asyncio.gather(
            *[self.analysis.run(r) for r in raw_results]
        )

        # 3. Rank and recommend
        return await self.recommender.run(req, analyses)
```

**`app/api/routes.py`**
```python
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from app.agents.orchestrator import OrchestratorAgent
from app.models.request import ShoppingRequest
import json

router = APIRouter(prefix="/api/v1")


@router.post("/search")
async def search(req: ShoppingRequest) -> dict:
    agent = OrchestratorAgent()
    result = await agent.run(req)
    return result.model_dump()


@router.post("/search/stream")
async def search_stream(req: ShoppingRequest) -> EventSourceResponse:
    """Server-Sent Events endpoint for real-time agent updates."""

    async def event_generator():
        agent = OrchestratorAgent()
        async for event in agent.stream(req):
            yield {"data": json.dumps(event)}

    return EventSourceResponse(event_generator())
```

**`app/main.py`**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Shopping Assistant API",
    description="Multi-agent shopping assistant powered by OpenAI + Tavily",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

---

## Frontend

### Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 15 (App Router) | React framework |
| shadcn/ui | Component library |
| Tailwind CSS v4 | Styling |
| TypeScript | Type safety |
| Framer Motion | Animations |
| Lucide React | Icons |
| pnpm | Package manager |

### Setup

```bash
cd frontend

# Install deps
pnpm install

# Configure env
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Dev server
pnpm dev
```

### Design System

The UI uses a **dark luxury** aesthetic: deep charcoal backgrounds, warm amber accents,
and sharp typography. Every transition should feel intentional.

**Color Palette:**
```css
/* globals.css */
:root {
  --bg-primary:     #0e0e10;   /* near-black canvas */
  --bg-surface:     #18181b;   /* card backgrounds */
  --bg-elevated:    #1f1f23;   /* elevated panels */
  --accent-gold:    #f59e0b;   /* primary CTA + highlights */
  --accent-warm:    #fb923c;   /* secondary accent */
  --text-primary:   #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted:     #52525b;
  --border:         #27272a;
  --border-active:  #3f3f46;
}
```

**Typography:**
- Display: `Playfair Display` (headings, hero)
- Body: `DM Sans` (UI copy, labels)
- Mono: `JetBrains Mono` (agent traces, JSON)

### Key Components

**`AgentStatusStream.tsx`** — live agent activity timeline
```tsx
"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Search, BarChart2, Star } from "lucide-react"

const AGENTS = {
  orchestrator: { icon: Bot,      label: "Orchestrator", color: "#f59e0b" },
  search:       { icon: Search,   label: "Search",       color: "#60a5fa" },
  analysis:     { icon: BarChart2,label: "Analysis",     color: "#34d399" },
  recommender:  { icon: Star,     label: "Recommender",  color: "#f472b6" },
} as const

type AgentKey = keyof typeof AGENTS

interface AgentEvent {
  agent: AgentKey
  status: "thinking" | "done" | "error"
  message: string
  timestamp: number
}

export function AgentStatusStream({ events }: { events: AgentEvent[] }) {
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {events.map((event, i) => {
          const { icon: Icon, label, color } = AGENTS[event.agent]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 
                         bg-zinc-900/60 px-4 py-3 text-sm backdrop-blur-sm"
            >
              <div
                className="mt-0.5 flex h-6 w-6 items-center justify-center 
                           rounded-full ring-1"
                style={{ color, borderColor: color + "40", background: color + "15" }}
              >
                <Icon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium" style={{ color }}>
                  {label}
                </span>
                <span className="ml-2 text-zinc-400">{event.message}</span>
              </div>
              {event.status === "thinking" && (
                <div className="flex gap-1 items-center mt-1">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
```

**`ProductCard.tsx`**
```tsx
import { ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types"

export function ProductCard({ product, rank }: { product: Product; rank: number }) {
  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 
                    p-5 transition-all hover:border-amber-500/50 hover:bg-zinc-800/80">
      {rank === 1 && (
        <Badge className="absolute -top-2.5 left-4 bg-amber-500 text-black text-xs font-semibold">
          ★ Top Pick
        </Badge>
      )}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold text-zinc-100 leading-snug line-clamp-2">
          {product.title}
        </h3>
        <span className="shrink-0 font-mono text-amber-400 font-medium">
          {product.price}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{product.reasoning}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-emerald-400">
            <ThumbsUp size={10} /> Pros
          </p>
          <ul className="space-y-1">
            {product.pros.slice(0, 3).map((p) => (
              <li key={p} className="text-xs text-zinc-400">• {p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-red-400">
            <ThumbsDown size={10} /> Cons
          </p>
          <ul className="space-y-1">
            {product.cons.slice(0, 3).map((c) => (
              <li key={c} className="text-xs text-zinc-400">• {c}</li>
            ))}
          </ul>
        </div>
      </div>
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg 
                   border border-zinc-700 py-2 text-sm text-zinc-300 
                   transition hover:border-amber-500 hover:text-amber-400"
      >
        View Product <ExternalLink size={13} />
      </a>
    </div>
  )
}
```

**`useShoppingStream.ts`**
```ts
import { useState, useCallback } from "react"
import type { AgentEvent, ShoppingResponse } from "@/types"

export function useShoppingStream() {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [result, setResult] = useState<ShoppingResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string, budget?: number) => {
    setEvents([])
    setResult(null)
    setLoading(true)

    const source = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/search/stream`,
    )

    // POST body via fetch since EventSource is GET-only;
    // use a session token approach or wrap in a POST → SSE pattern.
    // See: https://github.com/Azure/fetch-event-source for a typed alternative.

    source.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === "agent_event") {
        setEvents((prev) => [...prev, data.event])
      } else if (data.type === "result") {
        setResult(data.result)
        source.close()
        setLoading(false)
      }
    }

    source.onerror = () => {
      source.close()
      setLoading(false)
    }
  }, [])

  return { search, events, result, loading }
}
```

### `next.config.ts`

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
```

---

## API Reference

### `POST /api/v1/search`

**Request**
```json
{
  "query": "wireless noise-cancelling headphones under $200",
  "budget": 200,
  "currency": "USD",
  "max_results": 5
}
```

**Response**
```json
{
  "query": "wireless noise-cancelling headphones under $200",
  "products": [
    {
      "title": "Sony WH-1000XM4",
      "price": "$199",
      "url": "https://...",
      "pros": ["Best-in-class ANC", "30hr battery", "Multipoint pairing"],
      "cons": ["Touch controls finicky", "No IP rating"],
      "score": 0.94,
      "reasoning": "Industry-leading noise cancellation at the top of your budget."
    }
  ],
  "summary": "Found 5 strong options. Sony leads on ANC quality.",
  "search_queries_used": ["best noise cancelling headphones 2025 under 200"],
  "agent_trace": ["Orchestrator: decomposed query", "Search: 3 queries fired", ...]
}
```

### `POST /api/v1/search/stream`
Same request body. Returns SSE stream:
```
data: {"type": "agent_event", "event": {"agent": "search", "status": "thinking", ...}}
data: {"type": "agent_event", "event": {"agent": "analysis", "status": "done", ...}}
data: {"type": "result", "result": { ... }}
```

---

## Environment Variables

### Backend (`.env`)
```env
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
OPENAI_MODEL=gpt-4o
MAX_SEARCH_RESULTS=5
AGENT_TIMEOUT_SECONDS=30
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Development Workflow

```bash
# Run everything concurrently (root)
# Install concurrently: pnpm add -g concurrently

concurrently \
  "cd backend && uv run uvicorn app.main:app --reload" \
  "cd frontend && pnpm dev"
```

**Before every commit:**
```bash
cd backend
uv run ruff check . --fix && uv run ruff format . && uv run mypy app/

cd ../frontend
pnpm lint && pnpm type-check
```

---

## CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: uv sync
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy app/
      - run: uv run pytest

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm build
```

---

## Portfolio Notes

This project demonstrates:

- **Multi-agent orchestration** — fan-out/fan-in pattern, async parallel execution
- **Streaming UX** — real-time SSE agent events keep the UI alive during inference
- **Type safety end-to-end** — Pydantic v2 on the backend, TypeScript strict mode on the frontend
- **Modern Python tooling** — `uv` for dependency management, `ruff` for lint/format, `mypy` for types
- **Production patterns** — structured logging, graceful error handling, configurable via env

---

*Keep this file up to date as the project evolves.*
