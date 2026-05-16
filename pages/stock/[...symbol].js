import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '../../components/AppLayout'

function toNum(val) {
  if (val == null) return null
  if (typeof val === 'number') return val
  const n = parseFloat(String(val).replace(/[,%]/g, ''))
  return isNaN(n) ? null : n
}

function fmt(val, decimals = 2) {
  const n = toNum(val)
  return n == null ? (val != null ? String(val) : '—') : n.toFixed(decimals)
}

function formatChange(val) {
  if (val == null) return '—'
  // already formatted string like "-1.18%" — return as-is
  if (typeof val === 'string' && val.includes('%')) return val
  const num = toNum(val)
  if (num == null) return String(val)
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

function StatCard({ label, value }) {
  if (value == null) return null
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function OverviewCard({ data, type }) {
  const q = data.quote || {}
  const s = data.stats || {}
  const p = data.profile || {}

  return (
    <div className="overview-card">
      <div className="overview-header">
        <div>
          <h2 className="overview-symbol">{data.exchange}:{data.symbol}</h2>
          <p className="overview-name">{data.name || data.symbol}</p>
          {data.country && <span className="badge">{data.country}</span>}
        </div>
        <div className="overview-price-block">
          <div className="overview-price">
            {q.price != null ? (type === 'idx' ? q.price : `$${fmt(q.price)}`) : '—'}
          </div>
          {q.change != null && (
            <div className={`overview-change ${String(q.change).startsWith('-') || toNum(q.change) < 0 ? 'negative' : 'positive'}`}>
              {type === 'idx'
                ? `${q.change || ''} (${q.changePercent || '—'})`
                : `${toNum(q.change) >= 0 ? '+' : ''}${fmt(q.change)} (${formatChange(q.changePercent)})`}
            </div>
          )}
          {q.lastUpdated && <div className="overview-updated">Updated {q.lastUpdated}</div>}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Market Cap" value={s.marketCap} />
        <StatCard label="Volume" value={toNum(q.volume)?.toLocaleString() || q.volume} />
        <StatCard label="Day Range" value={q.dayRange || (q.dayHigh && q.dayLow ? (type === 'idx' ? `${fmt(q.dayLow)} – ${fmt(q.dayHigh)}` : `$${fmt(q.dayLow)} – $${fmt(q.dayHigh)}`) : null)} />
        <StatCard label="52W Range" value={s.week52Range || (s.week52Low && s.week52High ? (type === 'idx' ? `${fmt(s.week52Low)} – ${fmt(s.week52High)}` : `$${fmt(s.week52Low)} – $${fmt(s.week52High)}`) : null)} />
        <StatCard label="PE Ratio" value={s.peRatio} />
        <StatCard label="EPS" value={s.eps} />
        <StatCard label="Forward PE" value={s.forwardPE} />
        <StatCard label="Beta" value={s.beta} />
        <StatCard label="Dividend" value={s.dividend != null && typeof s.dividend === 'number' ? `${(s.dividend * 100).toFixed(2)}%` : s.dividend} />
        <StatCard label="RSI" value={s.rsi} />
        <StatCard label="Shares Out" value={s.sharesOut} />
        <StatCard label="Earnings" value={s.earningsDate} />
      </div>

      {p.description && (
        <div className="overview-about">
          <h3>About</h3>
          <p>{p.description}</p>
          {(p.industry || p.sector || p.founded) && (
            <div className="profile-meta">
              {p.industry && <span className="badge">{p.industry}</span>}
              {p.sector && <span className="badge">{p.sector}</span>}
              {p.founded && <span className="badge">Founded {p.founded}</span>}
            </div>
          )}
          <div className="source-link">
            Source: <a href={type === 'idx' ? `https://stockanalysis.com/quote/idx/${data.symbol}/` : `https://stockanalysis.com/stocks/${data.symbol}/`} target="_blank" rel="noopener noreferrer">StockAnalysis.com</a>
          </div>
        </div>
      )}

      {type === 'idx' && (
        <div className="unsupported-notice">
          📊 News and analyst ratings are not available on StockAnalysis for IDX stocks.
        </div>
      )}
    </div>
  )
}

function ConsensusCard({ summary }) {
  if (!summary) return null
  const upside = summary.upside
  return (
    <div className="consensus-card">
      <div className="stat-card">
        <div className="stat-label">Consensus</div>
        <div className={`stat-value consensus-${summary.consensus?.toLowerCase().replace(/\s+/g, '-')}`}>
          {summary.consensus || '—'}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Price Target</div>
        <div className="stat-value">{summary.priceTarget != null ? `$${fmt(summary.priceTarget)}` : '—'}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Upside</div>
        <div className={`stat-value ${upside != null && upside >= 0 ? 'positive' : 'negative'}`}>
          {upside != null ? formatChange(upside) : '—'}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Analysts</div>
        <div className="stat-value">{summary.totalAnalysts ?? '—'}</div>
      </div>
    </div>
  )
}

function RatingsTable({ ratings }) {
  if (!ratings?.length) return null
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Analyst</th>
            <th>Firm</th>
            <th>Action</th>
            <th>Rating</th>
            <th>Price Target</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((r, i) => (
            <tr key={i}>
              <td>{r.date || '—'}</td>
              <td>{r.analyst || '—'}</td>
              <td>{r.firm || '—'}</td>
              <td>
                <span className={`action-badge ${r.action?.toLowerCase()}`}>{r.action || '—'}</span>
              </td>
              <td>
                {r.rating || '—'}
                {r.previousRating && <span className="prev-rating"> from {r.previousRating}</span>}
              </td>
              <td>
                {r.priceTarget != null ? `$${r.priceTarget}` : '—'}
                {r.previousPriceTarget != null && <span className="prev-rating"> from ${r.previousPriceTarget}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NewsCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-card">
      {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="news-img" />}
      <div className="news-body">
        <div className="news-meta">
          {item.source && <span className="badge">{item.source}</span>}
          {item.tickers?.slice(0, 3).map((t) => (
            <Link key={t} href={`/stock/${t.toLowerCase()}`} className="badge ticker-link">{t}</Link>
          ))}
          {item.relativeTime && <span className="news-time">{item.relativeTime}</span>}
        </div>
        <h3 className="news-title">{item.title}</h3>
        {item.summary && <p className="news-summary">{item.summary}</p>}
      </div>
    </a>
  )
}

export default function StockDetailPage() {
  const router = useRouter()
  const { symbol } = router.query
  const [stockData, setStockData] = useState(null)
  const [news, setNews] = useState(null)
  const [ratings, setRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    const parts = Array.isArray(symbol) ? symbol : [symbol]
    const raw = parts.join('/').toLowerCase()
    const isIdx = raw.startsWith('idx:') || raw.startsWith('idx/')
    const code = isIdx ? raw.replace(/^idx[:/]/, '') : raw
    const type = isIdx ? 'idx' : 'us'

    setLoading(true)
    setError(null)
    setStockData(null)
    setNews(null)
    setRatings(null)

    const calls = [
      fetch(`/api/quote/${type}/${code}`).then((r) => r.json())
    ]
    if (!isIdx) {
      calls.push(fetch(`/api/news/${code}`).then((r) => r.json()))
      calls.push(fetch(`/api/ratings/${code}`).then((r) => r.json()))
    }

    Promise.all(calls)
      .then((results) => {
        const quoteData = results[0]
        if (!quoteData.success) throw new Error(quoteData.message || 'Failed to fetch stock data')
        setStockData({ ...quoteData.data, _type: type })

        if (!isIdx) {
          if (results[1]?.success) setNews(results[1])
          if (results[2]?.success) setRatings(results[2])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) {
    return (
      <AppLayout title="StockAnalysis Dashboard">
        <style jsx global>{styles}</style>
        <div className="page">
          <div className="spinner-wrap"><div className="spinner-ring" /></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="StockAnalysis Dashboard">
        <style jsx global>{styles}</style>
        <div className="page">
          <div className="error-box">
            <p>⚠️ {error}</p>
            <Link href="/" className="back-link">← Back to Dashboard</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const type = stockData._type
  const ticker = type === 'idx' ? `${type}:${stockData.symbol}` : stockData.symbol?.toUpperCase()

  return (
    <AppLayout title={`${ticker} — StockAnalysis Dashboard`}>
      <style jsx global>{styles}</style>
      <div className="page">
        <Link href="/" className="back-link">← Dashboard</Link>

        <OverviewCard data={stockData} type={type} />

        {!type || type === 'us' ? (
          <>
            <ConsensusCard summary={ratings?.summary} />

            {ratings?.data?.length > 0 && (
              <section className="section">
                <h2 className="section-title">Analyst Ratings ({ratings.total})</h2>
                <RatingsTable ratings={ratings.data} />
              </section>
            )}

            {news?.data?.length > 0 && (
              <section className="section">
                <h2 className="section-title">Latest News ({news.total})</h2>
                <div className="news-grid">
                  {news.data.map((item) => <NewsCard key={item.id} item={item} />)}
                </div>
              </section>
            )}
          </>
        ) : null}

        {!stockData && !loading && (
          <div className="empty-state">
            <p>No data available for {ticker}</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

const styles = `
  .page { max-width: 1200px; margin: 0 auto; padding: 24px; }
  .back-link { display: inline-block; font-size: 14px; color: #818cf8; margin-bottom: 20px; }
  .back-link:hover { color: #a5b4fc; }

  .overview-card { background: #0d0d14; border: 1px solid #1e2030; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
  .overview-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
  .overview-symbol { font-size: 24px; font-weight: 700; color: #818cf8; margin: 0 0 4px; }
  .overview-name { font-size: 16px; color: #64748b; margin: 0 0 8px; }
  .overview-price-block { text-align: right; }
  .overview-price { font-size: 36px; font-weight: 700; color: #e2e8f0; }
  .overview-change { font-size: 16px; font-weight: 600; margin-top: 4px; }
  .overview-change.positive { color: #22c55e; }
  .overview-change.negative { color: #ef4444; }
  .overview-updated { font-size: 11px; color: #475569; margin-top: 4px; }

  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; margin-bottom: 20px; }
  .stat-card { background: #111827; border-radius: 10px; padding: 12px; }
  .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .stat-value { font-size: 15px; font-weight: 600; color: #e2e8f0; word-break: break-all; }
  .stat-value.positive { color: #22c55e; }
  .stat-value.negative { color: #ef4444; }
  .stat-value.consensus-buy, .stat-value.consensus-strong-buy { color: #22c55e; }
  .stat-value.consensus-hold { color: #eab308; }
  .stat-value.consensus-sell, .stat-value.consensus-strong-sell { color: #ef4444; }

  .overview-about { border-top: 1px solid #1e2030; padding-top: 16px; }
  .overview-about h3 { font-size: 13px; font-weight: 600; color: #94a3b8; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .overview-about p { font-size: 13px; color: #64748b; line-height: 1.7; margin: 0 0 12px; }
  .profile-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .badge { font-size: 11px; padding: 3px 10px; border-radius: 999px; background: #1e2030; color: #94a3b8; }
  .ticker-link { background: #1e1b4b; color: #818cf8; cursor: pointer; }
  .ticker-link:hover { background: #312e81; }
  .source-link { font-size: 12px; color: #475569; margin-top: 8px; }
  .source-link a { color: #6366f1; }

  .unsupported-notice { margin-top: 16px; padding: 12px 16px; background: #1e2030; border-radius: 10px; font-size: 13px; color: #64748b; }

  .consensus-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 24px; }

  .section { margin-bottom: 40px; }
  .section-title { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-bottom: 16px; }

  .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #1e2030; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; background: #0d0d14; border-bottom: 1px solid #1e2030; }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #111827; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #0d0d14; }
  .action-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .action-badge.upgrade, .action-badge.initiated { background: #16a34a; color: #fff; }
  .action-badge.downgrade { background: #dc2626; color: #fff; }
  .action-badge.reiterated, .action-badge.maintained { background: #1e2030; color: #94a3b8; }
  .prev-rating { color: #475569; font-size: 11px; }

  .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .news-card { display: flex; flex-direction: column; background: #0d0d14; border: 1px solid #1e2030; border-radius: 12px; overflow: hidden; transition: border-color 0.15s, transform 0.15s; }
  .news-card:hover { border-color: #6366f1; transform: translateY(-2px); }
  .news-img { width: 100%; height: 160px; object-fit: cover; }
  .news-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .news-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .news-time { font-size: 11px; color: #475569; margin-left: auto; }
  .news-title { font-size: 14px; font-weight: 600; line-height: 1.4; color: #e2e8f0; }
  .news-summary { font-size: 12px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .spinner-wrap { display: flex; align-items: center; justify-content: center; padding: 80px; }
  .spinner-ring { width: 36px; height: 36px; border: 3px solid #1e2030; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-box { color: #ef4444; font-size: 14px; padding: 16px 20px; background: #1c0a0a; border: 1px solid #3f1515; border-radius: 12px; }
  .error-box p { margin: 0 0 12px; }
  .empty-state { text-align: center; padding: 60px 20px; color: #64748b; }

  @media (max-width: 640px) {
    .page { padding: 16px; }
    .overview-symbol { font-size: 20px; }
    .overview-price { font-size: 28px; }
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    .news-grid { grid-template-columns: 1fr; }
  }
`
