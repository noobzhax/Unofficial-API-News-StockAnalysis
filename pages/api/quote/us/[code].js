import vm from 'node:vm'

const REQUEST_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml'
}

function extractHydrationPayload(html) {
  const match = html.match(/data:\s*(\[\{type:"data".*?\])\s*,\s*form:\s*null/s)
  if (!match) throw new Error('Hydration payload not found')
  return vm.runInNewContext(`(${match[1]})`)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const code = String(req.query.code || '').trim().toLowerCase()
  if (!code) return res.status(400).json({ success: false, message: 'Stock code is required' })

  const quoteUrl = `https://stockanalysis.com/stocks/${code}/`

  try {
    const response = await fetch(quoteUrl, { headers: REQUEST_HEADERS, cache: 'no-store' })

    if (response.status === 404) {
      return res.status(404).json({ success: false, message: `Stock '${code}' not found` })
    }
    if (!response.ok) throw new Error(`Upstream request failed with status ${response.status}`)

    const html = await response.text()
    const payload = extractHydrationPayload(html)

    // StockAnalysis hydration: [0]=layout, [1]=stockInfo, [2]=quote data
    const info = payload?.[1]?.data?.info
    const quote = info?.quote
    const stats = info?.stats
    const profile = info?.profile

    const data = {
      exchange: info?.exchange || null,
      symbol: info?.ticker || code.toUpperCase(),
      name: info?.nameFull || info?.name || null,
      currency: 'USD',
      country: profile?.country || null,
      quote: {
        price: quote?.p ?? null,
        change: quote?.c ?? null,
        changePercent: quote?.cp ?? null,
        previousClose: quote?.pc ?? null,
        open: quote?.o ?? null,
        dayHigh: quote?.h ?? null,
        dayLow: quote?.l ?? null,
        volume: quote?.v ?? null,
        lastUpdated: quote?.u ?? null
      },
      stats: {
        marketCap: stats?.marketCap?.value ?? null,
        revenue: stats?.revenue?.value ?? null,
        netIncome: stats?.netIncome?.value ?? null,
        eps: stats?.eps?.value ?? null,
        peRatio: stats?.pe?.value ?? null,
        forwardPE: stats?.fpe?.value ?? null,
        dividend: stats?.dividendYield?.value ?? null,
        exDividendDate: stats?.exDividendDate?.value ?? null,
        sharesOut: stats?.sharesOut?.value ?? null,
        week52High: stats?.high52?.value ?? null,
        week52Low: stats?.low52?.value ?? null,
        beta: stats?.beta?.value ?? null,
        rsi: stats?.rsi?.value ?? null,
        averageVolume: stats?.avgVolume?.value ?? null,
        earningsDate: stats?.earningsDate?.value ?? null
      },
      profile: {
        description: profile?.description || null,
        industry: profile?.industry || null,
        sector: profile?.sector || null,
        founded: profile?.founded || null,
        employees: profile?.employees || null,
        website: profile?.website || null,
        ceo: profile?.ceo || null,
        headquarters: profile?.headquarters || null
      }
    }

    return res.status(200).json({
      success: true,
      source: quoteUrl,
      fetchedAt: new Date().toISOString(),
      data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch US stock quote',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
