import { fetchWithRetry } from '../../../../lib/fetchWithRetry.js'
import { extractHydrationPayload, extractMetaDescription, extractStat, extractTitle, stripTags } from '../../../../lib/htmlUtils.js'
import { ERROR_CODES, errorResponse } from '../../../../lib/apiErrors.js'

function findProfileInfo(value, depth = 0) {
  if (!value || depth > 8) return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProfileInfo(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof value === 'object') {
    const info = value.info || value.stockInfo || value.stock
    const profile = info?.profile || value.profile
    if (profile && (profile.description || profile.industry || profile.sector || profile.website || profile.ceo)) {
      return { info: info || value, profile }
    }

    for (const item of Object.values(value)) {
      const found = findProfileInfo(item, depth + 1)
      if (found) return found
    }
  }

  return null
}

function extractWebsite(html) {
  const match = html.match(/Website\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)
  return stripTags(match?.[2]) || match?.[1] || null
}

function parseName(title, code) {
  if (!title) return null
  return title
    .replace(new RegExp(`\\s*\\(${code.toUpperCase()}\\).*$`, 'i'), '')
    .replace(/\s+Stock Price.*$/i, '')
    .trim() || null
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

  const source = `https://stockanalysis.com/stocks/${code}/`

  try {
    const response = await fetchWithRetry(source)

    if (response.status === 404) {
      return errorResponse(res, 404, ERROR_CODES.NOT_FOUND, `Stock '${code}' not found`, { source })
    }

    if (!response.ok) {
      return errorResponse(res, response.status === 403 ? 403 : 502, response.status === 403 ? ERROR_CODES.UPSTREAM_BLOCKED : ERROR_CODES.UPSTREAM_ERROR, `Upstream request failed with status ${response.status}`, { source, upstreamStatus: response.status })
    }

    const html = await response.text()
    const hydration = extractHydrationPayload(html)
    const hydrated = findProfileInfo(hydration)
    const info = hydrated?.info
    const profile = hydrated?.profile
    const title = extractTitle(html)
    const symbol = (info?.ticker || info?.symbol || code).toUpperCase()

    const data = {
      symbol,
      name: info?.nameFull || info?.name || parseName(title, code),
      exchange: info?.exchange || extractStat(html, 'Stock Exchange'),
      currency: 'USD',
      country: profile?.country || 'United States',
      description: profile?.description || extractMetaDescription(html),
      industry: profile?.industry || null,
      sector: profile?.sector || null,
      website: profile?.website || extractWebsite(html),
      employees: profile?.employees ?? extractStat(html, 'Employees'),
      founded: profile?.founded || extractStat(html, 'Founded'),
      ceo: profile?.ceo || extractStat(html, 'CEO'),
      headquarters: profile?.headquarters || extractStat(html, 'Headquarters')
    }

    return res.status(200).json({
      success: true,
      source,
      fetchedAt: new Date().toISOString(),
      data
    })
  } catch (error) {
    return errorResponse(res, 500, ERROR_CODES.UPSTREAM_ERROR, 'Failed to fetch US stock profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      source
    })
  }
}
