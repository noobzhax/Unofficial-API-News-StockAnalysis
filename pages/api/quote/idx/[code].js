import { fetchWithRetry } from '../../../../lib/fetchWithRetry.js'
import { extractMetaDescription, extractStat, extractTitle, stripTags } from '../../../../lib/htmlUtils.js'


function extractPriceBlock(html) {
  const text = stripTags(html)
  const priceMatch = text.match(/(?:Full Chart Watchlist Compare\s*)?([0-9][0-9,.]*)\s+([+-][0-9][0-9,.]*)\s+\(([+-]?[0-9.]+%)\)/i)
  const lastUpdatedMatch = text.match(/Last updated:\s*([^|]+?)(?:Market Cap|Volume|About IDX:|Industry|$)/i)

  return {
    price: priceMatch?.[1] || null,
    change: priceMatch?.[2] || null,
    changePercent: priceMatch?.[3] || null,
    lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null
  }
}

function extractAbout(html, symbol) {
  const pattern = new RegExp(`<h2[^>]*>\\s*About\\s+IDX:${symbol}\\s*<\\/h2>([\\s\\S]*?)(?:<h2|<h3|<table|<\/main>)`, 'i')
  const match = html.match(pattern)
  return stripTags(match?.[1]) || null
}

function extractLinkTextAfterLabel(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}\\s*<a[^>]*>([\\s\\S]*?)<\\/a>`, 'i')
  const match = html.match(pattern)
  return stripTags(match?.[1]) || null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const code = String(req.query.code || '').trim().toLowerCase()

  if (!code) {
    return res.status(400).json({ success: false, message: 'Stock code is required' })
  }

  const quoteUrl = `https://stockanalysis.com/quote/idx/${code}/`

  try {
    const response = await fetchWithRetry(quoteUrl)

    if (response.status === 404) {
      return res.status(404).json({ success: false, message: `IDX stock code '${code}' was not found` })
    }

    if (!response.ok) {
      throw new Error(`Upstream request failed with status ${response.status}`)
    }

    const html = await response.text()
    const symbol = code.toUpperCase()
    const priceBlock = extractPriceBlock(html)
    const title = extractTitle(html)
    const titleMatch = title?.match(/^(.*?)\s*\(IDX:([^)]+)\)/i)

    const data = {
      exchange: 'IDX',
      symbol,
      name: titleMatch?.[1] || title || null,
      currency: 'IDR',
      country: 'Indonesia',
      quote: priceBlock,
      stats: {
        marketCap: extractStat(html, 'Market Cap'),
        revenue: extractStat(html, 'Revenue'),
        netIncome: extractStat(html, 'Net Income'),
        eps: extractStat(html, 'EPS'),
        sharesOut: extractStat(html, 'Shares Out'),
        peRatio: extractStat(html, 'PE Ratio'),
        forwardPE: extractStat(html, 'Forward PE'),
        dividend: extractStat(html, 'Dividend'),
        exDividendDate: extractStat(html, 'Ex-Dividend Date'),
        volume: extractStat(html, 'Volume'),
        averageVolume: extractStat(html, 'Average Volume'),
        open: extractStat(html, 'Open'),
        previousClose: extractStat(html, 'Previous Close'),
        dayRange: extractStat(html, "Day's Range"),
        week52Range: extractStat(html, '52-Week Range'),
        beta: extractStat(html, 'Beta'),
        rsi: extractStat(html, 'RSI'),
        earningsDate: extractStat(html, 'Earnings Date')
      },
      profile: {
        description: extractAbout(html, symbol) || extractMetaDescription(html),
        industry: extractLinkTextAfterLabel(html, 'Industry'),
        sector: extractLinkTextAfterLabel(html, 'Sector'),
        founded: extractStat(html, 'Founded'),
        stockExchange: extractStat(html, 'Stock Exchange') || 'Indonesia Stock Exchange',
        tickerSymbol: extractStat(html, 'Ticker Symbol') || symbol
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
      message: 'Failed to fetch StockAnalysis IDX quote',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
