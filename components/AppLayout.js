import Link from 'next/link'
import { useTheme } from '../hooks/useTheme'

export default function AppLayout({ children, title = 'StockAnalysis Dashboard' }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <>
      <style jsx global>{`
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
        body.theme-light .mini-price,
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
        body.theme-light .mini-price { color: #0f172a; }
        body.theme-light .stock-mini-info { border-color: #e2e8f0; }

        .header { border-bottom: 1px solid #1e2030; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; background: #0d0d14; }
        .header-brand { display: flex; align-items: center; gap: 10px; }
        .header-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .header-title { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
        .header-sub { font-size: 12px; color: #64748b; }
        .header-actions { display: flex; align-items: center; gap: 10px; }
        .header-time { font-size: 12px; color: #475569; }
        .theme-toggle { height: 36px; min-width: 36px; padding: 0 10px; border-radius: 999px; border: 1px solid #1e2030; background: #111827; color: #e2e8f0; cursor: pointer; font-size: 15px; transition: all 0.15s; }
        .theme-toggle:hover { border-color: #6366f1; transform: translateY(-1px); }
      `}</style>

      <div className="header">
        <div className="header-brand">
          <div className="header-dot" />
          <div>
            <Link href="/" className="header-title">{title}</Link>
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

      {children}
    </>
  )
}
