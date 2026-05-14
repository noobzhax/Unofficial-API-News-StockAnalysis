import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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

function TickerSearch() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = useCallback(async (e) => {
    e.preventDefault()
    const ticker = code.trim().toLowerCase()
    if (!ticker) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      // Check if IDX stock (format: idx:wbsa or just wbsa for IDX)
      const isIDX = ticker.startsWith('idx:')
      const cleanCode = isIDX ? ticker.replace('idx:', '') : ticker
      
      if (isIDX) {
        // Fetch IDX quote
        const res = await fetch(`/api/quote/idx/${cleanCode}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed')
        setResult({ type: 'idx-quote', ...json })
      } else {
        // Fetch US stock news
        const res = await fetch(`/api/news/${cleanCode}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed')
        setResult({ type: 'news', ...json })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [code])

  return (
    <div className="ticker-search">
      <form onSubmit={search} className="search-form">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Search ticker, e.g. AAPL or idx:wbsa"
          className="search-input"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </form>
      <p className="search-hint">Tip: Use <code>idx:CODE</code> for Indonesia stocks (e.g. idx:wbsa, idx:bbca)</p>
      {error && <p className="error-msg">{error}</p>}
      {result && result.type === 'idx-quote' && (
        <div className="ticker-results">
          <div className="idx-quote-card">
            <div className="quote-header">
              <div>
                <h2 className="quote-symbol">{result.data?.exchange}:{result.data?.symbol}</h2>
                <p className="quote-name">{result.data?.name}</p>
              </div>
              <div className="quote-price-block">
                <div className="quote-price">{result.data?.quote?.price || '—'}</div>
                <div className={`quote-change ${result.data?.quote?.changePercent?.startsWith('-') ? 'negative' : 'positive'}`}>
                  {result.data?.quote?.change} ({result.data?.quote?.changePercent})
                </div>
                <div className="quote-updated">{result.data?.quote?.lastUpdated}</div>
              </div>
            </div>
            <div className="quote-stats">
              <div className="stat-row">
                <span className="stat-label">Market Cap</span>
                <span className="stat-value">{result.data?.stats?.marketCap || '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Volume</span>
                <span className="stat-value">{result.data?.stats?.volume || '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Day's Range</span>
                <span className="stat-value">{result.data?.stats?.dayRange || '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">52-Week Range</span>
                <span className="stat-value">{result.data?.stats?.week52Range || '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">PE Ratio</span>
                <span className="stat-value">{result.data?.stats?.peRatio || '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">RSI</span>
                <span className="stat-value">{result.data?.stats?.rsi || '—'}</span>
              </div>
            </div>
            {result.data?.profile?.description && (
              <div className="quote-about">
                <h3>About</h3>
                <p>{result.data.profile.description}</p>
                <div className="profile-meta">
                  {result.data.profile.industry && <span className="badge">{result.data.profile.industry}</span>}
                  {result.data.profile.sector && <span className="badge">{result.data.profile.sector}</span>}
                  {result.data.profile.founded && <span className="badge">Founded {result.data.profile.founded}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {result && result.type === 'news' && (
        <div className="ticker-results">
          <p className="results-label">{result.total} news for <strong>{result.ticker?.toUpperCase()}</strong></p>
          <div className="news-grid">
            {result.data?.map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('news')
  const [data, setData] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [theme, setTheme] = useState('dark')

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

  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  const isDark = theme === 'dark'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; }
        a { color: inherit; text-decoration: none; }
        body.theme-light { background: #f8fafc; color: #0f172a; }
        body.theme-light .header,
        body.theme-light .news-card,
        body.theme-light .idx-quote-card,
        body.theme-light th,
        body.theme-light .search-input { background: #ffffff; border-color: #e2e8f0; }
        body.theme-light .tabs,
        body.theme-light .header { border-color: #e2e8f0; }
        body.theme-light .tab:hover,
        body.theme-light .tab.active,
        body.theme-light tr:hover td,
        body.theme-light .stat-row,
        body.theme-light .badge,
        body.theme-light .section-count,
        body.theme-light .search-hint code { background: #eef2ff; }
        body.theme-light .header-title,
        body.theme-light .section-title,
        body.theme-light .news-title,
        body.theme-light .stock-price,
        body.theme-light .quote-price,
        body.theme-light .stat-value,
        body.theme-light .results-label strong { color: #0f172a; }
        body.theme-light .header-sub,
        body.theme-light .header-time,
        body.theme-light .news-summary,
        body.theme-light .quote-name,
        body.theme-light .quote-about p,
        body.theme-light .results-label,
        body.theme-light .search-hint,
        body.theme-light .section-count,
        body.theme-light .name-cell,
        body.theme-light th,
        body.theme-light .stat-label { color: #64748b; }
        body.theme-light td { border-color: #e2e8f0; }
        body.theme-light .search-input { color: #0f172a; }
        body.theme-light .theme-toggle { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }

        .header { border-bottom: 1px solid #1e2030; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; background: #0d0d14; }
        .header-brand { display: flex; align-items: center; gap: 10px; }
        .header-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .header-title { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
        .header-sub { font-size: 12px; color: #64748b; }
        .header-actions { display: flex; align-items: center; gap: 10px; }
        .header-time { font-size: 12px; color: #475569; }
        .theme-toggle { height: 36px; min-width: 36px; padding: 0 10px; border-radius: 999px; border: 1px solid #1e2030; background: #111827; color: #e2e8f0; cursor: pointer; font-size: 15px; transition: all 0.15s; }
        .theme-toggle:hover { border-color: #6366f1; transform: translateY(-1px); }

        .tabs { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid #1e2030; overflow-x: auto; }
        .tab { padding: 8px 16px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #64748b; transition: all 0.15s; white-space: nowrap; }
        .tab:hover { color: #94a3b8; background: #1e2030; }
        .tab.active { color: #e2e8f0; background: #1e2030; border-bottom: 2px solid #6366f1; }

        .content { padding: 24px; max-width: 1200px; margin: 0 auto; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: 600; }
        .section-count { font-size: 12px; color: #475569; background: #1e2030; padding: 3px 10px; border-radius: 999px; }

        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .news-card { display: flex; flex-direction: column; background: #0d0d14; border: 1px solid #1e2030; border-radius: 12px; overflow: hidden; transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
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
        body.theme-light .mini-price { color: #0f172a; }
        body.theme-light .stock-mini-info { border-color: #e2e8f0; }

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

        .spinner { display: flex; align-items: center; justify-content: center; padding: 80px; }
        .spinner-ring { width: 36px; height: 36px; border: 3px solid #1e2030; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-msg { color: #ef4444; font-size: 13px; padding: 12px 16px; background: #1c0a0a; border: 1px solid #3f1515; border-radius: 8px; }

        .search-hint { font-size: 12px; color: #475569; margin-top: 4px; }
        .search-hint code { background: #1e2030; padding: 1px 5px; border-radius: 4px; color: #818cf8; }
        .idx-quote-card { background: #0d0d14; border: 1px solid #1e2030; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .quote-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
        .quote-symbol { font-size: 18px; font-weight: 700; color: #818cf8; margin: 0 0 4px; }
        .quote-name { font-size: 13px; color: #64748b; margin: 0; }
        .quote-price-block { text-align: right; }
        .quote-price { font-size: 28px; font-weight: 700; color: #e2e8f0; }
        .quote-change { font-size: 14px; font-weight: 600; margin-top: 2px; }
        .quote-updated { font-size: 11px; color: #475569; margin-top: 2px; }
        .quote-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
        .stat-row { display: flex; justify-content: space-between; gap: 8px; padding: 8px 12px; background: #111827; border-radius: 8px; }
        .stat-label { font-size: 12px; color: #64748b; }
        .stat-value { font-size: 12px; font-weight: 600; color: #e2e8f0; text-align: right; }
        .quote-about { border-top: 1px solid #1e2030; padding-top: 16px; }
        .quote-about h3 { font-size: 13px; font-weight: 600; color: #94a3b8; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .quote-about p { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 12px; }
        .profile-meta { display: flex; flex-wrap: wrap; gap: 6px; }
        .badge { font-size: 11px; padding: 3px 10px; border-radius: 999px; background: #1e2030; color: #94a3b8; }

        @media (max-width: 640px) {
          .content { padding: 16px; }
          .news-grid { grid-template-columns: 1fr; }
          .header { padding: 12px 16px; }
          .tabs { padding: 12px 16px 0; }
        }
      `}</style>

      <div className="header">
        <div className="header-brand">
          <div className="header-dot" />
          <div>
            <div className="header-title">StockAnalysis Dashboard</div>
            <div className="header-sub">Unofficial API — stockanalysis.com</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-time">{new Date().toUTCString()}</div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

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
    </>
  )
}
