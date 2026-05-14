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
