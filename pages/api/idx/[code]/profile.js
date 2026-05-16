import { fetchWithRetry } from '../../../../lib/fetchWithRetry.js'
import { extractMetaDescription, extractStat, extractTitle, stripTags } from '../../../../lib/htmlUtils.js'
import { ERROR_CODES, errorResponse } from '../../../../lib/apiErrors.js'

function extractAbout(html, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<h2[^>]*>\\s*About\\s+IDX:${escaped}\\s*<\\/h2>([\\s\\S]*?)(?:<h2|<h3|<table|<\\/main>)`, 'i'),
    /<h2[^>]*>\s*About\s+[^<]+<\/h2>([\s\S]*?)(?:<h2|<h3|<table|<\/main>)/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    const value = stripTags(match?.[1])
    if (value) return value
  }

  return null
}

function extractLinkTextAfterLabel(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`${escaped}\\s*<a[^>]*>([\\s\\S]*?)<\\/a>`, 'i'),
    new RegExp(`<[^>]*>\\s*${escaped}\\s*<\\/[^>]+>\\s*<[^>]*>\\s*<a[^>]*>([\\s\\S]*?)<\\/a>`, 'i')
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    const value = stripTags(match?.[1])
    if (value) return value
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return errorResponse(res, 405, ERROR_CODES.INVALID_REQUEST, 'Method not allowed')
  }

  const code = String(req.query.code || '').trim().toLowerCase()
  if (!code) {
    return errorResponse(res, 400, ERROR_CODES.INVALID_REQUEST, 'Stock code is required')
  }

  const source = `https://stockanalysis.com/quote/idx/${code}/`

  try {
    const response = await fetchWithRetry(source)

    if (response.status === 404) {
      return errorResponse(res, 404, ERROR_CODES.NOT_FOUND, `IDX stock code '${code}' was not found`, { source })
    }

    if (!response.ok) {
      return errorResponse(res, response.status === 403 ? 403 : 502, response.status === 403 ? ERROR_CODES.UPSTREAM_BLOCKED : ERROR_CODES.UPSTREAM_ERROR, `Upstream request failed with status ${response.status}`, { source, upstreamStatus: response.status })
    }

    const html = await response.text()
    const symbol = code.toUpperCase()
    const title = extractTitle(html)
    const titleMatch = title?.match(/^(.*?)\s*\(IDX:([^)]+)\)/i)
    const name = titleMatch?.[1] || title?.replace(/\s+Stock Price.*$/i, '') || null

    const data = {
      exchange: 'IDX',
      symbol,
      name,
      currency: 'IDR',
      country: 'Indonesia',
      description: extractAbout(html, symbol) || extractMetaDescription(html),
      industry: extractLinkTextAfterLabel(html, 'Industry'),
      sector: extractLinkTextAfterLabel(html, 'Sector'),
      founded: extractStat(html, 'Founded'),
      stockExchange: extractStat(html, 'Stock Exchange') || 'Indonesia Stock Exchange',
      tickerSymbol: extractStat(html, 'Ticker Symbol') || symbol
    }

    return res.status(200).json({
      success: true,
      source,
      fetchedAt: new Date().toISOString(),
      data
    })
  } catch (error) {
    return errorResponse(res, 500, ERROR_CODES.UPSTREAM_ERROR, 'Failed to fetch StockAnalysis IDX profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      source
    })
  }
}
