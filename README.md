# TrustLayer

**Alternative Trust Layer for Financial Inclusion** — JunctionX Kathmandu 2026, Hi-Tech track.

A credit-scoring trust layer for unbanked merchants. Gives a credit score to someone with zero formal banking history using behaviour, character (psychometrics), and community trust — then explains every decision and audits it for fairness.

> _(Name is a placeholder — rename together.)_

---

## ⚠️ THE API CONTRACT IS LAW

This README defines the exact JSON between the engine and the UI. **Both developers build against these shapes.** If a shape must change, tell the other person immediately and update this file in the same commit. This contract is what lets us work fully in parallel — the UI is built against these shapes with stubbed data while the engine is built behind them.

---

## Repo Structure

```
trustlayer/
├── engine/        ML friend owns — Python + FastAPI
│   └── data/merchants.json   3rd teammate owns
└── ui/            You own — React + TypeScript + Vite
```

No file overlap between `engine/` and `ui/`, so merge conflicts should be near zero.

---

## Running locally

**Engine** (terminal 1):

```bash
cd engine
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**UI** (terminal 2):

```bash
cd ui
npm install
npm run dev        # opens http://localhost:5173
```

UI reads the engine URL from `ui/.env`:

```
VITE_API_URL=http://localhost:8000
```

---

## API CONTRACT

Base URL: `http://localhost:8000`. All responses are JSON. All money is in NPR (integer rupees).

### Shared enums / shapes

```
band:        "Low" | "Medium" | "High"
confidence:  "Low" | "Medium" | "High"
gate_status: "none" | "soft" | "hard"
sign:        "+" | "-"
```

---

### 1. `POST /score`

Score a single merchant.

**Request body:**

```json
{
  "id": "saraswati",
  "psychometric": 0.72,
  "months_of_data": 18,
  "cashflow_monthly": 60000,
  "bill_ontime_ratio": 0.93,
  "qr_consistency": 0.88,
  "airtime_regularity": 0.8,
  "requested_loan": 45000
}
```

| field                | type        | meaning                                                 |
| -------------------- | ----------- | ------------------------------------------------------- |
| `id`                 | string      | merchant id                                             |
| `psychometric`       | float 0–1   | quiz result (P)                                         |
| `months_of_data`     | int         | months of behavioural history (pre-existing counts too) |
| `cashflow_monthly`   | int         | avg monthly cash flow, NPR — drives loan ceiling        |
| `bill_ontime_ratio`  | float 0–1   | share of bills paid on time                             |
| `qr_consistency`     | float 0–1   | steadiness of QR/transaction volume                     |
| `airtime_regularity` | float 0–1   | regularity of airtime top-ups                           |
| `requested_loan`     | int or null | amount requested (for fraud gate); null if just scoring |

**Response:**

```json
{
  "id": "saraswati",
  "score": 720,
  "band": "Medium",
  "confidence": "High",
  "loan_ceiling": 45000,
  "gate_status": "none",
  "gate_reason": null,
  "explanation": [
    { "factor": "Steady QR income (3 yrs)", "sign": "+" },
    { "factor": "Bills on time 14/15 months", "sign": "+" },
    { "factor": "3 high-quality community vouches", "sign": "+" },
    { "factor": "Thin formal credit history", "sign": "-" }
  ]
}
```

| field          | type           | meaning                                              |
| -------------- | -------------- | ---------------------------------------------------- |
| `score`        | int 0–1000     | final score, confidence already folded in            |
| `band`         | enum           | risk band from score                                 |
| `confidence`   | enum           | how much proof backs the score                       |
| `loan_ceiling` | int            | recommended max loan, NPR (0 if not approved)        |
| `gate_status`  | enum           | fraud-gate result                                    |
| `gate_reason`  | string or null | why flagged, e.g. `"Loan request 8x typical volume"` |
| `explanation`  | array          | the transparency list — UI renders each as +/− chip  |

---

### 2. `GET /graph`

The whole social graph for the visualization.

**Response:**

```json
{
  "nodes": [
    {
      "id": "saraswati",
      "name": "Saraswati Tea",
      "trust": 0.74,
      "score": 720,
      "fraud": false
    },
    {
      "id": "f1",
      "name": "Merchant F1",
      "trust": 0.31,
      "score": 410,
      "fraud": true
    }
  ],
  "edges": [{ "source": "ram", "target": "saraswati", "weight": 0.9 }]
}
```

| node field | type      | meaning                                             |
| ---------- | --------- | --------------------------------------------------- |
| `id`       | string    | unique id                                           |
| `name`     | string    | display label                                       |
| `trust`    | float 0–1 | EigenTrust/PageRank value → drives node size/colour |
| `score`    | int       | final score (so clicking a node can show it)        |
| `fraud`    | bool      | true → render node RED                              |

| edge field | type      | meaning                         |
| ---------- | --------- | ------------------------------- |
| `source`   | string    | voucher id (arrow start)        |
| `target`   | string    | vouchee id (arrow end)          |
| `weight`   | float 0–1 | vouch strength → edge thickness |

---

### 3. `GET /fairness`

Data for the fairness before/after chart.

**Response:**

```json
{
  "groups": ["Community A", "Community B"],
  "before": { "Community A": 712, "Community B": 548 },
  "after": { "Community A": 705, "Community B": 668 },
  "note": "Equally-reliable merchants. 'before' = community weight 0.8, 'after' = 0.2. Gap shrinks from 164 to 37."
}
```

`before` = naive (community-heavy) scoring; `after` = personal-dominant fix. UI shows two grouped bars per community and highlights the shrinking gap.

---

### 4. `GET /merchants` _(convenience, optional)_

List merchants so the UI dropdown can populate without hardcoding.

**Response:**

```json
[
  { "id": "saraswati", "name": "Saraswati Tea" },
  { "id": "bardan", "name": "Bardan Store" }
]
```

---

## UI: stub first, connect later

Build the whole UI against fake responses before the engine exists. In `ui/src/api.ts`:

```ts
const BASE = import.meta.env.VITE_API_URL;
const USE_STUB = true; // flip to false when engine is ready

export async function getScore(m: MerchantInput): Promise<ScoreResult> {
  if (USE_STUB) return STUB_SCORE; // hardcoded sample matching the contract
  const r = await fetch(`${BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });
  return r.json();
}
```

Define the contract types once in `ui/src/types.ts` so they match this README exactly.

---

## Engine: CORS on day one

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)
```

---

## Git

- Branch per person (`feat/engine`, `feat/ui`) merged into `main` often, or just commit to `main` — folders don't overlap so conflicts are rare.
- Commit small, push at every working checkpoint.

`.gitignore`:

```
node_modules/
ui/dist/
engine/venv/
engine/__pycache__/
*.pyc
.env
.DS_Store
```

---

## Ownership

| Area                         | Owner                    |
| ---------------------------- | ------------------------ |
| `engine/` (all .py)          | ML friend                |
| `engine/data/merchants.json` | 3rd teammate             |
| `ui/` (all)                  | You                      |
| **This API contract**        | Both — guard it together |

---

## Demo merchants (must exist in `merchants.json`)

| id          | proves                                                         |
| ----------- | -------------------------------------------------------------- |
| `saraswati` | happy path — high score, full loan                             |
| `bardan`    | cold-start solved — newcomer w/ pre-existing bills, small loan |
| `kumar`     | honest edge case — no footprint, tiny probation loan           |
| `f1`–`f5`   | fraud ring — flagged, rendered red                             |
| `maya`      | fairness — reliable, poor community, scores fairly             |

---

## Definition of done (per day)

- **Day 1:** `/score` returns real numbers for one merchant; UI shell + score panel render against stub.
- **Day 2:** `/graph` live; UI graph renders with fraud ring red; UI connected to real engine (`USE_STUB=false`).
- **Day 3:** `/fairness` live + chart; polish; demo rehearsed 5×.
