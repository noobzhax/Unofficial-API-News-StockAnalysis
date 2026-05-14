import { useState, useEffect, useCallback } from 'react'
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
    ? `/stock/idx:${result.code}`
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

  const search = useCallback(async (e) => {
    e.preventDefault()
    const ticker = code.trim().toLowerCase()
    if (!ticker) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(ticker)}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      setResult(json)
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
          placeholder="Search ticker, e.g. AAPL or idx:bbca"
          className="search-input"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </form>
      <p className="search-hint">Tip: Use <code>idx:CODE</code> for Indonesia stocks (e.g. idx:wbsa, idx:bbca)</p>
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
