# StockAnalysis Dashboard FE/BE Roadmap Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Define the next implementable frontend and backend features for the unofficial StockAnalysis dashboard/API.

**Architecture:** Keep Vercel-compatible Next.js Pages Router. Backend stays in `pages/api/**` serverless routes; frontend stays in `pages/index.js` and `pages/stock/[symbol].js` until complexity requires components extraction. Prefer no new heavy dependencies unless clearly useful.

**Tech Stack:** Next.js, React, serverless API routes, StockAnalysis HTML hydration scraping, Vercel.

---

## Current State

**Done:**
- Dashboard tabs: market news, IPO news, trending, gainers, losers, ticker search.
- Stock detail page: `/stock/[symbol]` with news + analyst ratings.
- IDX quote endpoint: `/api/quote/idx/[code]` and search using `idx:CODE`.
- Dark/light toggle in dashboard.
- News cards show mini stock details for linked tickers.

**Known constraints:**
- StockAnalysis may return Cloudflare 403 in some environments.
- IDX on StockAnalysis supports overview/quote page, but not news/ratings pages.
- Keep deployment Vercel-friendly; avoid custom Express server for production.

---

## Recommended Feature Roadmap

## Wave 1 — High Impact UI/UX Polish

### Feature 1: Persistent theme + reusable layout

**Value:** User expects theme toggle to stay after refresh and be consistent across dashboard/detail page.

**Frontend:**
- Persist theme in `localStorage`.
- Apply same theme toggle to `/stock/[symbol]`.
- Extract shared layout/header into component.

**Backend:** None.

**Files:**
- Create: `components/AppLayout.js`
- Create: `hooks/useTheme.js`
- Modify: `pages/index.js`
- Modify: `pages/stock/[symbol].js`

**Acceptance Criteria:**
- Toggle dark/light on `/` and `/stock/aapl`.
- Refresh page keeps chosen theme.
- No duplicate header/theme code between pages.

---

### Feature 2: Better stock detail overview cards

**Value:** Detail page should look closer to StockAnalysis overview, not only news/ratings.

**Frontend:**
- Add overview section with price, market cap, volume, day range, 52-week range, PE ratio, EPS, dividend, beta.
- Add profile section: sector, industry, exchange, description.
- Add source link back to StockAnalysis.

**Backend:**
- Add US stock quote/profile endpoint.
- Reuse IDX quote parser pattern where possible.

**Files:**
- Create: `pages/api/quote/us/[code].js`
- Modify: `pages/stock/[symbol].js`
- Optional create: `lib/parseStockAnalysisQuote.js`

**Acceptance Criteria:**
- `/api/quote/us/aapl` returns quote + stats + profile.
- `/stock/aapl` shows overview card above ratings/news.
- `/stock/idx:bbca` or equivalent strategy can render IDX quote details.

---

### Feature 3: Search result preview cards

**Value:** User gets useful result immediately after searching without opening detail page.

**Frontend:**
- For US ticker search, show compact detail card: price, consensus, target, upside, latest 3 news.
- Add button: “Open full detail”.
- For IDX ticker search, add button: “Open IDX detail”.

**Backend:**
- Optionally create aggregate endpoint to avoid multiple fetches.

**Files:**
- Modify: `pages/index.js`
- Optional create: `pages/api/stock/[code].js`

**Acceptance Criteria:**
- Search `AAPL` shows price/ratings/news preview.
- Search `idx:bbca` shows IDX quote preview.
- CTA opens detail page.

---

## Wave 2 — Backend Aggregation & Performance

### Feature 4: Unified stock detail API

**Value:** Frontend should call one endpoint instead of many scattered requests.

**Backend:**
- Create `/api/stock/[code]` aggregate endpoint.
- For US: combine quote, ratings, news.
- For IDX: combine IDX quote only and return unsupported markers for news/ratings.
- Normalize response shape.

**Frontend:**
- Detail page calls `/api/stock/[code]` once.
- Dashboard news mini info can use cached/aggregate result where appropriate.

**Files:**
- Create: `pages/api/stock/[code].js`
- Modify: `pages/stock/[symbol].js`
- Modify: `pages/index.js`
- Optional create: `lib/stockCode.js`

**Acceptance Criteria:**
- `/api/stock/aapl` returns `{ quote, ratings, news, unsupported: [] }`.
- `/api/stock/idx:bbca` returns `{ quote, ratings: null, news: null, unsupported: ['ratings','news'] }`.
- Detail page renders both US and IDX from same endpoint.

---

### Feature 5: Server-side response caching

**Value:** Reduce duplicate scraping and improve Vercel performance.

**Backend:**
- Add simple in-memory TTL cache per serverless instance.
- TTL examples:
  - news/trending/gainers/losers: 5–10 min
  - quote: 1–5 min
  - ratings: 1 hour
- Add response metadata: `cached`, `cacheTtlSeconds`, `fetchedAt`.

**Frontend:**
- Show “Last updated” and cached badge.

**Files:**
- Create: `lib/cache.js`
- Modify: all API routes under `pages/api/**`

**Acceptance Criteria:**
- Same endpoint called twice returns second response faster with `cached: true` when same instance.
- Existing response shape remains backward compatible.

---

### Feature 6: Better error handling for Cloudflare / upstream failures

**Value:** Current 403 looks broken; users need clear state and fallback.

**Backend:**
- Detect 403 Cloudflare responses.
- Return structured error code: `UPSTREAM_BLOCKED`.
- Include source URL and retry suggestion.

**Frontend:**
- Friendly error cards with endpoint name, upstream status, and fallback link to StockAnalysis.
- Partial rendering: if ratings fails but news works, still show news.

**Files:**
- Create: `lib/apiErrors.js`
- Modify: API routes
- Modify: `pages/index.js`
- Modify: `pages/stock/[symbol].js`

**Acceptance Criteria:**
- 403 returns `{ success:false, code:'UPSTREAM_BLOCKED' }`.
- Frontend shows clear “StockAnalysis blocked this request” message, not generic failed.

---

## Wave 3 — Discovery & Watchlist Features

### Feature 7: Watchlist

**Value:** Users can track favorite US/IDX stocks.

**Frontend:**
- Add watchlist tab.
- Add “Add to watchlist” button on detail page and search cards.
- Store locally in `localStorage`.
- Show quick cards: symbol, price, change, consensus/upside if available.

**Backend:**
- Use aggregate endpoint to hydrate watchlist items.

**Files:**
- Create: `hooks/useWatchlist.js`
- Modify: `pages/index.js`
- Modify: `pages/stock/[symbol].js`

**Acceptance Criteria:**
- Add/remove AAPL and idx:bbca.
- Watchlist persists after refresh.
- Watchlist loads cards without breaking when one ticker fails.

---

### Feature 8: Market screener filters

**Value:** Make gainers/losers/trending more useful.

**Frontend:**
- Add search/filter input above tables.
- Sort by symbol, change, market cap, views.
- Add quick filters: positive, negative, large cap.

**Backend:** None initially.

**Files:**
- Modify: `pages/index.js`
- Optional create: `components/StockTable.js`

**Acceptance Criteria:**
- Filter table by text.
- Sort columns by clicking header.
- Works on trending/gainers/losers.

---

### Feature 9: Ticker mention intelligence

**Value:** Convert news into stock intelligence: which tickers are being discussed most.

**Backend:**
- Add `/api/intelligence/mentions`.
- Fetch latest market news.
- Count ticker mentions.
- Return top tickers with article counts and latest headlines.

**Frontend:**
- Add “Mentions” tab.
- Show top tickers and linked headlines.

**Files:**
- Create: `pages/api/intelligence/mentions.js`
- Modify: `pages/index.js`

**Acceptance Criteria:**
- Endpoint returns top ticker mentions from latest news.
- UI shows ranked list with count and sample headlines.

---

## Wave 4 — Advanced StockAnalysis-like Features

### Feature 10: Analyst rating history visualization

**Value:** Detail page becomes more like StockAnalysis ratings page.

**Frontend:**
- Add mini timeline of rating actions.
- Add distribution cards: Buy/Hold/Sell count if available.
- Highlight upgrades/downgrades.

**Backend:**
- Use existing ratings data.
- Add derived fields: actionCounts, ratingCounts, averagePriceTarget.

**Files:**
- Modify: `pages/api/ratings/[code].js`
- Modify: `pages/stock/[symbol].js`

**Acceptance Criteria:**
- Ratings endpoint includes derived summary.
- Detail page renders rating distribution and timeline.

---

### Feature 11: IPO calendar detail

**Value:** IPO tab becomes richer, not just headlines.

**Backend:**
- Investigate StockAnalysis IPO pages for calendar/table data.
- Add endpoint if data exists: `/api/ipos/calendar`.

**Frontend:**
- IPO calendar tab/table: company, symbol, date, exchange, price range, shares.

**Files:**
- Create: `pages/api/ipos/calendar.js`
- Modify: `pages/index.js`

**Acceptance Criteria:**
- IPO calendar renders if source data is available.
- Graceful empty state if source unsupported.

---

### Feature 12: IDX detail page parity

**Value:** Indonesian stock search should feel first-class.

**Backend:**
- Normalize IDX code parsing: `idx:bbca`.
- Extend `/stock/[symbol]` routing to support encoded IDX symbols safely.
- Add IDX detail rendering from `/api/quote/idx/[code]`.

**Frontend:**
- Detail page can show IDX quote/profile cards.
- Hide unsupported ratings/news with clear label.

**Files:**
- Modify: `pages/stock/[symbol].js`
- Modify: `pages/api/stock/[code].js` if unified endpoint exists
- Optional create: `lib/stockCode.js`

**Acceptance Criteria:**
- Opening IDX detail page shows quote, stats, profile.
- Page clearly says news/ratings unavailable on StockAnalysis for IDX.

---

## Suggested Implementation Order

1. **Feature 4: Unified stock detail API** — unlocks cleaner FE.
2. **Feature 2: Better stock detail overview cards** — biggest visible improvement.
3. **Feature 12: IDX detail page parity** — important because IDX already requested.
4. **Feature 1: Shared layout/theme persistence** — polish + maintainability.
5. **Feature 7: Watchlist** — product value.
6. **Feature 5: Server-side caching** — performance.
7. **Feature 8: Screener filters** — usability.
8. **Feature 9: Ticker mention intelligence** — unique value.
9. **Feature 6: Better upstream error handling** — robustness.
10. **Feature 10/11** — advanced improvements.

---

## Next Building Plan Recommendation

If executing next, start with:

# Unified Stock Detail API + Enhanced Detail Page

**Scope:**
- Create `/api/stock/[code]`.
- Add US quote parser endpoint if needed.
- Update `/stock/[symbol]` to render overview + ratings + news from one response.
- Add IDX detail support with unsupported-state labels.

**Why first:** It reduces frontend complexity, makes IDX/US consistent, and unlocks watchlist/search preview later.

**Validation commands:**
```bash
npm run build
curl -s http://localhost:3000/api/stock/aapl | jq .success
curl -s http://localhost:3000/api/stock/idx:bbca | jq .success
```

**Commit format:**
```bash
git commit -m "feat: add unified stock detail API"
git commit -m "feat: render enhanced stock detail page"
```
