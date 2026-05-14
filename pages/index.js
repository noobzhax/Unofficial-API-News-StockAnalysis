import { useState, useEffect, useCallback } from 'react'
import { IDX_STOCKS } from '../lib/idxStocks'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'

const TABS = [
  { key: 'news', label: 'Market News' },
  { key: 'ipos', label: 'IPO News' },
  { key: 'trending', label: 'Trending' },
  { key: 'gainers', label: 'Top Gainers' },
  { key: 'losers', label: 'Top Losers' },
]

function formatChange(val) {
  if (val == null) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return val
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

function formatMarketCap(val) {
  if (val == null) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return val
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  return `$${num.toLocaleString()}`
}

function NewsCard({ item }) {
  const [stockInfo, setStockInfo] = useState(null)
  const mainTicker = item.tickers?.[0]

  useEffect(() => {
    if (!mainTicker) return
    fetch(`/api/ratings/${mainTicker.toLowerCase()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStockInfo({
            price: json.currentPrice,
            consensus: json.summary?.consensus,
            priceTarget: json.summary?.priceTarget,
            upside: json.summary?.upside
          })
        }
      })
      .catch(() => {})
  }, [mainTicker])

  return (
    <article className="news-card">
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} className="news-img" />
      )}
      <div className="news-body">
        <div className="news-meta">
          {item.source && <span className="badge">{item.source}</span>}
          {item.tickers?.slice(0, 3).map((t) => (
            <Link key={t} href={`/stock/${t.toLowerCase()}`} className="badge ticker-link">
              {t}
            </Link>
          ))}
          {item.relativeTime && <span className="news-time">{item.relativeTime}</span>}
        </div>
        <h3 className="news-title">{item.title}</h3>
        {item.summary && <p className="news-summary">{item.summary}</p>}
        {stockInfo && (
          <div className="stock-mini-info">
            {stockInfo.price != null && <span className="mini-price">${stockInfo.price.toFixed(2)}</span>}
            {stockInfo.consensus && (
              <span className={`mini-consensus consensus-${stockInfo.consensus.toLowerCase().replace(/\s+/g, '-')}`}>
                {stockInfo.consensus}
              </span>
            )}
            {stockInfo.priceTarget != null && <span className="mini-target">Target ${stockInfo.priceTarget.toFixed(2)}</span>}
            {stockInfo.upside != null && (
              <span className={`mini-upside ${stockInfo.upside >= 0 ? 'positive' : 'negative'}`}>
                {stockInfo.upside >= 0 ? '+' : ''}{stockInfo.upside.toFixed(1)}%
              </span>
            )}
          </div>
        )}
        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-source">Read source →</a>}
      </div>
    </article>
  )
}

function StockTable({ data, type }) {
  const isChange = type === 'gainers' || type === 'losers'
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {type === 'trending' && <th>#</th>}
            <th>Symbol</th>
            <th>Name</th>
            <th>Change</th>
            <th>Market Cap</th>
            {type === 'trending' && <th>Views</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const change = parseFloat(item.changePercent)
            const isPositive = !isNaN(change) && change >= 0
            return (
              <tr key={item.symbol || i}>
                {type === 'trending' && <td className="rank">{item.rank ?? i + 1}</td>}
                <td>
                  <Link href={`/stock/${String(item.symbol).toLowerCase()}`} className="symbol-link">
                    {item.symbol}
                  </Link>
                </td>
                <td className="name-cell">{item.name || '—'}</td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  {formatChange(item.changePercent)}
                </td>
                <td>{formatMarketCap(item.marketCap)}</td>
                {type === 'trending' && (
                  <td>{item.views != null ? Number(item.views).toLocaleString() : '—'}</td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StockPreviewCard({ result }) {
  const quote = result.quote
  const ratings = result.ratings
  const news = result.news
  const q = quote?.quote || {}
  const stats = quote?.stats || {}
  const profile = quote?.profile || {}
  const detailPath = result.type === 'idx'
    ? `/stock/idx/${result.code}`
    : `/stock/${result.code}`

  return (
    <div className="preview-card">
      <div className="preview-header">
        <div>
          <h2 className="preview-symbol">{result.type === 'idx' ? 'IDX:' : ''}{result.symbol}</h2>
          <p className="preview-name">{result.name || quote?.name || '—'}</p>
          <div className="profile-meta">
            {profile.industry && <span className="badge">{profile.industry}</span>}
            {profile.sector && <span className="badge">{profile.sector}</span>}
            {result.type === 'idx' && <span className="badge">Indonesia</span>}
          </div>
        </div>
        <div className="preview-price-block">
          <div className="preview-price">{q.price != null ? (result.type === 'idx' ? q.price : `$${q.price.toFixed(2)}`) : '—'}</div>
          {q.change != null && (
            <div className={`preview-change ${String(q.change).startsWith('-') || q.change < 0 ? 'negative' : 'positive'}`}>
              {result.type === 'idx'
                ? `${q.change || ''} (${q.changePercent || '—'})`
                : `${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)} (${q.changePercent != null ? `${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%` : '—'})`}
            </div>
          )}
        </div>
      </div>

      <div className="preview-stats">
        <div><span>Market Cap</span><strong>{stats.marketCap || '—'}</strong></div>
        <div><span>Volume</span><strong>{q.volume?.toLocaleString?.() || stats.volume || '—'}</strong></div>
        <div><span>PE</span><strong>{stats.peRatio || '—'}</strong></div>
        <div><span>RSI</span><strong>{stats.rsi || '—'}</strong></div>
      </div>

      {ratings?.summary && (
        <div className="preview-analyst">
          <span className={`mini-consensus consensus-${ratings.summary.consensus?.toLowerCase().replace(/\s+/g, '-')}`}>
            {ratings.summary.consensus || 'Consensus N/A'}
          </span>
          {ratings.summary.priceTarget != null && <span>Target ${ratings.summary.priceTarget.toFixed(2)}</span>}
          {ratings.summary.upside != null && (
            <span className={ratings.summary.upside >= 0 ? 'positive' : 'negative'}>
              {ratings.summary.upside >= 0 ? '+' : ''}{ratings.summary.upside.toFixed(1)}%
            </span>
          )}
        </div>
      )}

      {profile.description && <p className="preview-description">{profile.description}</p>}

      {news?.data?.length > 0 && (
        <div className="preview-news">
          <h3>Latest News</h3>
          {news.data.slice(0, 3).map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          ))}
        </div>
      )}

      {result.unsupported?.length > 0 && (
        <p className="unsupported-small">Unavailable on StockAnalysis: {result.unsupported.join(', ')}</p>
      )}

      <div className="preview-actions">
        <Link href={detailPath} className="open-detail-btn">Open full detail →</Link>
      </div>
    </div>
  )
}

function TickerSearch() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleInput = (val) => {
    setCode(val)
    const q = val.trim().toLowerCase()
    // Show IDX suggestions when user types idx: or just letters that match IDX stocks
    if (q.length >= 1) {
      const isIdxPrefix = q.startsWith('idx:')
      const searchQ = isIdxPrefix ? q.replace('idx:', '') : q
      // Filter IDX_STOCKS inline (imported via window or passed as prop)
      const filtered = IDX_STOCKS
        .filter((s) =>
          s.symbol.toLowerCase().includes(searchQ) ||
          s.name.toLowerCase().includes(searchQ)
        )
        .slice(0, 8)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (symbol) => {
    const val = `idx:${symbol.toLowerCase()}`
    setCode(val)
    setSuggestions([])
    setShowSuggestions(false)
    doSearch(val)
  }

  const doSearch = async (ticker) => {
    const t = (ticker || code).trim().toLowerCase()
    if (!t) return
    setLoading(true)
    setError(null)
    setResult(null)
    setShowSuggestions(false)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(t)}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      setResult(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const search = useCallback(async (e) => {
    e.preventDefault()
    doSearch(code)
  }, [code])

  return (
    <div className="ticker-search">
      <div className="search-wrap">
        <form onSubmit={search} className="search-form">
          <input
            type="text"
            value={code}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => code.trim().length >= 1 && setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search ticker, e.g. AAPL or idx:bbca"
            className="search-input"
            autoComplete="off"
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>
        {showSuggestions && (
          <div className="suggestions-dropdown">
            {suggestions.map((stock) => (
              <button
                key={stock.symbol}
                type="button"
                className="suggestion-item"
                onMouseDown={() => selectSuggestion(stock.symbol)}
              >
                <span className="suggestion-symbol">IDX:{stock.symbol}</span>
                <span className="suggestion-name">{stock.name}</span>
                <span className="suggestion-sector">{stock.sector}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="search-hint">Tip: Use <code>idx:CODE</code> for Indonesia stocks (e.g. idx:bbca, idx:tlkm)</p>
      <div className="idx-popular">
        <span className="idx-popular-label">Popular IDX:</span>
        {['BBCA','BBRI','TLKM','GOTO','ASII','ADRO','ANTM','BUKA'].map((sym) => (
          <button
            key={sym}
            type="button"
            className="idx-chip"
            onClick={() => selectSuggestion(sym)}
          >
            {sym}
          </button>
        ))}
      </div>
      {error && <p className="error-msg">{error}</p>}
      {result && <StockPreviewCard result={result} />}
    </div>
  )
}


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('news')
  const [data, setData] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const fetchTab = useCallback(async (tab) => {
    if (data[tab]) return
    setLoading((prev) => ({ ...prev, [tab]: true }))
    setErrors((prev) => ({ ...prev, [tab]: null }))
    try {
      const url = tab === 'ipos' ? '/api/news/ipos' : `/api/${tab}`
      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch')
      setData((prev) => ({ ...prev, [tab]: json }))
    } catch (err) {
      setErrors((prev) => ({ ...prev, [tab]: err.message }))
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }))
    }
  }, [data])

  useEffect(() => {
    fetchTab(activeTab)
  }, [activeTab, fetchTab])

  const current = data[activeTab]
  const isLoading = loading[activeTab]
  const error = errors[activeTab]

  return (
    <AppLayout>
      <style jsx global>{`
        .tabs { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid #1e2030; overflow-x: auto; }
        .tab { padding: 8px 16px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #64748b; transition: all 0.15s; white-space: nowrap; }
        .tab:hover { color: #94a3b8; background: #1e2030; }
        .tab.active { color: #e2e8f0; background: #1e2030; border-bottom: 2px solid #6366f1; }

        .content { padding: 24px; max-width: 1200px; margin: 0 auto; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: 600; }
        .section-count { font-size: 12px; color: #475569; background: #1e2030; padding: 3px 10px; border-radius: 999px; }

        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .news-card { display: flex; flex-direction: column; background: #0d0d14; border: 1px solid #1e2030; border-radius: 12px; overflow: hidden; transition: border-color 0.15s, transform 0.15s; }
        .news-card:hover { border-color: #6366f1; transform: translateY(-2px); }
        .news-img { width: 100%; height: 160px; object-fit: cover; }
        .news-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .news-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #1e2030; color: #94a3b8; }
        .badge.ticker { background: #1e1b4b; color: #818cf8; }
        .news-time { font-size: 11px; color: #475569; margin-left: auto; }
        .news-title { font-size: 14px; font-weight: 600; line-height: 1.4; color: #e2e8f0; }
        .news-summary { font-size: 12px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .stock-mini-info { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #1e2030; }
        .mini-price { font-size: 16px; font-weight: 700; color: #e2e8f0; }
        .mini-consensus { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; }
        .mini-consensus.consensus-strong-buy, .mini-consensus.consensus-buy { background: #16a34a; color: #fff; }
        .mini-consensus.consensus-hold { background: #eab308; color: #000; }
        .mini-consensus.consensus-sell, .mini-consensus.consensus-strong-sell { background: #dc2626; color: #fff; }
        .mini-target { font-size: 11px; color: #94a3b8; }
        .mini-upside { font-size: 12px; font-weight: 700; }
        .read-source { font-size: 12px; color: #818cf8; margin-top: 4px; display: inline-block; }
        .read-source:hover { color: #a5b4fc; }
        .ticker-link { background: #1e1b4b; color: #818cf8; }
        .ticker-link:hover { background: #312e81; }

        .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #1e2030; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; background: #0d0d14; border-bottom: 1px solid #1e2030; }
        td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #111827; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #0d0d14; }
        .rank { color: #475569; font-size: 12px; }
        .symbol-link { font-weight: 700; color: #818cf8; }
        .symbol-link:hover { color: #a5b4fc; }
        .name-cell { color: #94a3b8; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .positive { color: #22c55e; font-weight: 600; }
        .negative { color: #ef4444; font-weight: 600; }

        .ticker-search { display: flex; flex-direction: column; gap: 20px; }
        .search-form { display: flex; gap: 10px; }
        .search-input { flex: 1; max-width: 360px; padding: 10px 16px; background: #0d0d14; border: 1px solid #1e2030; border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .search-input:focus { border-color: #6366f1; }
        .search-input::placeholder { color: #475569; }
        .search-btn { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .search-btn:hover { background: #4f46e5; }
        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .results-label { font-size: 13px; color: #64748b; }
        .results-label strong { color: #e2e8f0; }

        .preview-card { background: #0d0d14; border: 1px solid #1e2030; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .preview-header { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .preview-symbol { font-size: 22px; color: #818cf8; margin: 0 0 4px; }
        .preview-name { font-size: 14px; color: #64748b; margin: 0 0 8px; }
        .preview-price-block { text-align: right; }
        .preview-price { font-size: 30px; font-weight: 700; color: #e2e8f0; }
        .preview-change { font-size: 14px; font-weight: 700; }
        .preview-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
        .preview-stats div { background: #111827; border-radius: 10px; padding: 10px; display: flex; justify-content: space-between; gap: 8px; }
        .preview-stats span { font-size: 11px; color: #64748b; }
        .preview-stats strong { font-size: 12px; color: #e2e8f0; text-align: right; }
        .preview-analyst { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #94a3b8; }
        .preview-description { font-size: 13px; color: #64748b; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .preview-news { border-top: 1px solid #1e2030; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .preview-news h3 { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .preview-news a { font-size: 13px; color: #e2e8f0; line-height: 1.4; }
        .preview-news a:hover { color: #818cf8; }
        .unsupported-small { font-size: 12px; color: #64748b; background: #1e2030; padding: 8px 10px; border-radius: 8px; }
        .preview-actions { display: flex; justify-content: flex-end; }
        .open-detail-btn { background: #6366f1; color: #fff; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 700; }
        .open-detail-btn:hover { background: #4f46e5; }
        body.theme-light .preview-card { background: #fff; border-color: #e2e8f0; }
        body.theme-light .preview-price, body.theme-light .preview-stats strong, body.theme-light .preview-news a { color: #0f172a; }
        body.theme-light .preview-stats div, body.theme-light .unsupported-small { background: #eef2ff; }
        body.theme-light .preview-news { border-color: #e2e8f0; }
        body.theme-light .mini-price { color: #0f172a; }
        body.theme-light .stock-mini-info { border-color: #e2e8f0; }
        body.theme-light .news-card { background: #fff; border-color: #e2e8f0; }
        body.theme-light th, body.theme-light .search-input { background: #fff; border-color: #e2e8f0; color: #0f172a; }
        body.theme-light .tab:hover, body.theme-light .tab.active, body.theme-light tr:hover td, body.theme-light .badge, body.theme-light .section-count { background: #eef2ff; }
        body.theme-light .news-title, body.theme-light .section-title { color: #0f172a; }
        body.theme-light td { border-color: #e2e8f0; }

        .search-wrap { position: relative; }
        .suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; max-width: 500px; background: #0d0d14; border: 1px solid #6366f1; border-radius: 10px; margin-top: 4px; z-index: 100; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .suggestion-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: transparent; border: none; cursor: pointer; text-align: left; transition: background 0.1s; }
        .suggestion-item:hover { background: #1e2030; }
        .suggestion-symbol { font-size: 13px; font-weight: 700; color: #818cf8; min-width: 90px; }
        .suggestion-name { font-size: 12px; color: #94a3b8; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .suggestion-sector { font-size: 11px; color: #475569; white-space: nowrap; }
        .idx-popular { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .idx-popular-label { font-size: 12px; color: #475569; }
        .idx-chip { padding: 4px 12px; background: #1e1b4b; color: #818cf8; border: 1px solid #312e81; border-radius: 999px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .idx-chip:hover { background: #312e81; border-color: #6366f1; }
        body.theme-light .suggestions-dropdown { background: #fff; border-color: #6366f1; }
        body.theme-light .suggestion-item:hover { background: #eef2ff; }
        body.theme-light .suggestion-name { color: #475569; }
        body.theme-light .idx-chip { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }

        .spinner { display: flex; align-items: center; justify-content: center; padding: 80px; }
        .spinner-ring { width: 36px; height: 36px; border: 3px solid #1e2030; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-msg { color: #ef4444; font-size: 13px; padding: 12px 16px; background: #1c0a0a; border: 1px solid #3f1515; border-radius: 8px; }

        .search-hint { font-size: 12px; color: #475569; margin-top: 4px; }
        .search-hint code { background: #1e2030; padding: 1px 5px; border-radius: 4px; color: #818cf8; }
        .profile-meta { display: flex; flex-wrap: wrap; gap: 6px; }

        @media (max-width: 640px) {
          .content { padding: 16px; }
          .news-grid { grid-template-columns: 1fr; }
          .tabs { padding: 12px 16px 0; }
        }
      `}</style>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <button
          className={`tab${activeTab === 'ticker' ? ' active' : ''}`}
          onClick={() => setActiveTab('ticker')}
        >
          Ticker Search
        </button>
      </div>

      <div className="content">
        {activeTab === 'ticker' ? (
          <TickerSearch />
        ) : isLoading ? (
          <div className="spinner"><div className="spinner-ring" /></div>
        ) : error ? (
          <p className="error-msg">Error: {error}</p>
        ) : current ? (
          <>
            <div className="section-header">
              <span className="section-title">
                {TABS.find((t) => t.key === activeTab)?.label}
              </span>
              {current.total != null && (
                <span className="section-count">{current.total} items</span>
              )}
            </div>
            {(activeTab === 'news' || activeTab === 'ipos') ? (
              <div className="news-grid">
                {current.data?.map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            ) : (
              <StockTable data={current.data || []} type={activeTab} />
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
