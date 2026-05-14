import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card"
    >
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} className="news-img" />
      )}
      <div className="news-body">
        <div className="news-meta">
          {item.source && <span className="badge">{item.source}</span>}
          {item.relativeTime && <span className="news-time">{item.relativeTime}</span>}
        </div>
        <h3 className="news-title">{item.title}</h3>
        {item.summary && <p className="news-summary">{item.summary}</p>}
      </div>
    </a>
  )
}

function RatingsTable({ ratings }) {
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
                <span className={`action-badge ${r.action?.toLowerCase()}`}>
                  {r.action || '—'}
                </span>
              </td>
              <td>
                {r.rating || '—'}
                {r.previousRating && ` (from ${r.previousRating})`}
              </td>
              <td>
                {r.priceTarget != null ? `$${r.priceTarget}` : '—'}
                {r.previousPriceTarget != null && ` (from $${r.previousPriceTarget})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function StockDetailPage() {
  const router = useRouter()
  const { symbol } = router.query
  const [news, setNews] = useState(null)
  const [ratings, setRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    const code = String(symbol).toLowerCase()
    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/api/news/${code}`).then((r) => r.json()),
      fetch(`/api/ratings/${code}`).then((r) => r.json()),
    ])
      .then(([newsData, ratingsData]) => {
        setNews(newsData.success ? newsData : null)
        setRatings(ratingsData.success ? ratingsData : null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) {
    return (
      <>
        <style jsx global>{styles}</style>
        <div className="page">
          <div className="spinner-wrap">
            <div className="spinner-ring" />
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <style jsx global>{styles}</style>
        <div className="page">
          <div className="error-box">{error}</div>
        </div>
      </>
    )
  }

  const ticker = String(symbol).toUpperCase()
  const currentPrice = ratings?.currentPrice
  const consensus = ratings?.summary?.consensus
  const priceTarget = ratings?.summary?.priceTarget
  const upside = ratings?.summary?.upside

  return (
    <>
      <style jsx global>{styles}</style>
      <div className="page">
        <header className="page-header">
          <Link href="/" className="back-link">← Dashboard</Link>
          <div className="header-content">
            <div className="header-left">
              <h1 className="stock-symbol">{ticker}</h1>
              <p className="stock-name">{ratings?.name || news?.ticker || ticker}</p>
            </div>
            {currentPrice != null && (
              <div className="header-right">
                <div className="stock-price">${currentPrice.toFixed(2)}</div>
                {consensus && (
                  <div className={`consensus-badge ${consensus.toLowerCase()}`}>
                    {consensus}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {ratings?.summary && (
          <section className="section">
            <h2 className="section-title">Analyst Consensus</h2>
            <div className="consensus-grid">
              <div className="stat-card">
                <div className="stat-label">Consensus</div>
                <div className={`stat-value consensus-${ratings.summary.consensus?.toLowerCase()}`}>
                  {ratings.summary.consensus || '—'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Price Target</div>
                <div className="stat-value">
                  {priceTarget != null ? `$${priceTarget.toFixed(2)}` : '—'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Upside</div>
                <div className={`stat-value ${upside != null && upside >= 0 ? 'positive' : 'negative'}`}>
                  {upside != null ? formatChange(upside) : '—'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Analysts</div>
                <div className="stat-value">{ratings.summary.totalAnalysts ?? '—'}</div>
              </div>
            </div>
          </section>
        )}

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
              {news.data.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {!ratings?.data?.length && !news?.data?.length && (
          <div className="empty-state">
            <p>No data available for {ticker}</p>
          </div>
        )}
      </div>
    </>
  )
}

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; }
  a { color: inherit; text-decoration: none; }

  .page { max-width: 1200px; margin: 0 auto; padding: 24px; }
  .page-header { margin-bottom: 32px; }
  .back-link { display: inline-block; font-size: 14px; color: #818cf8; margin-bottom: 16px; }
  .back-link:hover { color: #a5b4fc; }
  .header-content { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
  .header-left { flex: 1; }
  .stock-symbol { font-size: 32px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
  .stock-name { font-size: 16px; color: #64748b; margin: 0; }
  .header-right { text-align: right; }
  .stock-price { font-size: 36px; font-weight: 700; color: #e2e8f0; }
  .consensus-badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .consensus-badge.buy, .consensus-badge.strong.buy { background: #16a34a; color: #fff; }
  .consensus-badge.hold { background: #eab308; color: #000; }
  .consensus-badge.sell, .consensus-badge.strong.sell { background: #dc2626; color: #fff; }

  .section { margin-bottom: 40px; }
  .section-title { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-bottom: 16px; }

  .consensus-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .stat-card { background: #0d0d14; border: 1px solid #1e2030; border-radius: 12px; padding: 16px; }
  .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #e2e8f0; }
  .stat-value.positive { color: #22c55e; }
  .stat-value.negative { color: #ef4444; }
  .stat-value.consensus-buy, .stat-value.consensus-strong.buy { color: #22c55e; }
  .stat-value.consensus-hold { color: #eab308; }
  .stat-value.consensus-sell, .stat-value.consensus-strong.sell { color: #ef4444; }

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

  .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .news-card { display: flex; flex-direction: column; background: #0d0d14; border: 1px solid #1e2030; border-radius: 12px; overflow: hidden; transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
  .news-card:hover { border-color: #6366f1; transform: translateY(-2px); }
  .news-img { width: 100%; height: 160px; object-fit: cover; }
  .news-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .news-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #1e2030; color: #94a3b8; }
  .news-time { font-size: 11px; color: #475569; margin-left: auto; }
  .news-title { font-size: 14px; font-weight: 600; line-height: 1.4; color: #e2e8f0; }
  .news-summary { font-size: 12px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .spinner-wrap { display: flex; align-items: center; justify-content: center; padding: 80px; }
  .spinner-ring { width: 36px; height: 36px; border: 3px solid #1e2030; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-box { color: #ef4444; font-size: 14px; padding: 16px 20px; background: #1c0a0a; border: 1px solid #3f1515; border-radius: 12px; }
  .empty-state { text-align: center; padding: 60px 20px; color: #64748b; }

  @media (max-width: 640px) {
    .page { padding: 16px; }
    .stock-symbol { font-size: 24px; }
    .stock-price { font-size: 28px; }
    .news-grid { grid-template-columns: 1fr; }
  }
`
