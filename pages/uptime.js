export async function getServerSideProps({ req }) {
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host
  const baseUrl = `${protocol}://${host}`

  try {
    const response = await fetch(`${baseUrl}/api/uptime`, {
      headers: { accept: 'application/json' },
    })

    if (!response.ok) {
      return {
        props: {
          payload: null,
          error: 'Failed to load uptime data from /api/uptime',
        },
      }
    }

    const payload = await response.json()
    return { props: { payload, error: null } }
  } catch (error) {
    return {
      props: {
        payload: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

export default function UptimePage({ payload, error }) {
  const results = Array.isArray(payload?.data) ? payload.data : []
  const allHealthy = Boolean(payload?.uptime)

  return (
    <>
      <style jsx global>{`
        body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 32px; }
        .wrap { max-width: 1100px; margin: 0 auto; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 14px 12px; border-bottom: 1px solid #1f2937; vertical-align: top; }
        th { color: #93c5fd; font-size: 14px; }
        h1 { margin: 0 0 8px; }
        p { color: #94a3b8; }
        code { color: #f8fafc; }
        .pill { display:inline-block; padding:4px 10px; border-radius:999px; color:#fff; font-weight:700; }
        .up { background:#16a34a; }
        .down { background:#dc2626; }
        .error { color: #f87171; }
      `}</style>
      <div className="wrap">
        <div className="card">
          <h1>API Route Monitoring</h1>
          {error ? (
            <p className="error">{error}</p>
          ) : (
            <>
              <p>
                Status saat ini:{' '}
                <strong style={{ color: allHealthy ? '#4ade80' : '#f87171' }}>
                  {allHealthy ? 'SEMUA ROUTE UP' : 'ADA ROUTE BERMASALAH'}
                </strong>
              </p>
              <p>Checked at: {payload?.checkedAt || new Date().toISOString()}</p>
              <p>Healthy: {payload?.healthy ?? 0} / {payload?.total ?? results.length}</p>
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.route}>
                      <td><code>{result.route}</code></td>
                      <td><span className={`pill ${result.ok ? 'up' : 'down'}`}>{result.ok ? 'UP' : 'DOWN'}</span></td>
                      <td>{result.responseTimeMs} ms</td>
                      <td>{result.error || `HTTP ${result.status}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  )
}
