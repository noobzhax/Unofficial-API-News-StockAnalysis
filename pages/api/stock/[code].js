import { cacheGet, cacheSet, cacheGetMeta } from '../../../lib/cache'
import { API_ERRORS, createError } from '../../../lib/apiErrors'

function parseCode(input) {
  const raw = String(input || '').trim().toLowerCase()
  if (!raw) return null
  if (raw.startsWith('idx:')) {
    return { type: 'idx', code: raw.replace('idx:', ''), display: raw }
  }
  return { type: 'us', code: raw, display: raw }
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host
  return `${protocol}://${host}`
}

async function fetchJson(url) {
  const res = await fetch(url)
  return res.json()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json(createError(API_ERRORS.INVALID_REQUEST, 'Method not allowed'))
  }

  const parsed = parseCode(req.query.code)
  if (!parsed?.code) {
    return res.status(400).json(createError(API_ERRORS.INVALID_REQUEST, 'Stock code is required'))
  }

  const cacheKey = `stock:${parsed.type}:${parsed.code}`
  const cached = cacheGet(cacheKey)
  if (cached) {
    return res.status(200).json({ ...cached, cached: true, cache: cacheGetMeta(cacheKey) })
  }

  const baseUrl = getBaseUrl(req)

  try {
    let quote = null
    let news = null
    let ratings = null
    let profile = null
    let unsupported = []
    let errors = []

    if (parsed.type === 'idx') {
      const [quoteData, profileData] = await Promise.allSettled([
        fetchJson(`${baseUrl}/api/quote/idx/${parsed.code}`),
        fetchJson(`${baseUrl}/api/idx/${parsed.code}/profile`)
      ])

      if (quoteData.status === 'rejected' || !quoteData.value?.success) {
        const err = quoteData.status === 'fulfilled' ? quoteData.value : { code: API_ERRORS.UPSTREAM_ERROR, message: quoteData.reason?.message || 'Request failed' }
        return res.status(err.code === API_ERRORS.NOT_FOUND ? 404 : 502).json(err)
      }

      quote = quoteData.value

      if (profileData.status === 'fulfilled' && profileData.value?.success) {
        profile = profileData.value.data
      } else {
        errors.push({ source: 'profile', message: profileData.status === 'rejected' ? profileData.reason?.message || 'Request failed' : profileData.value?.message || 'Profile unavailable' })
      }

      unsupported = ['news', 'ratings']
    } else {
      const [quoteData, newsData, ratingsData, profileData] = await Promise.allSettled([
        fetchJson(`${baseUrl}/api/quote/us/${parsed.code}`),
        fetchJson(`${baseUrl}/api/news/${parsed.code}`),
        fetchJson(`${baseUrl}/api/ratings/${parsed.code}`),
        fetchJson(`${baseUrl}/api/stock/${parsed.code}/profile`)
      ])

      for (const [label, result] of [
        ['quote', quoteData],
        ['news', newsData],
        ['ratings', ratingsData]
      ]) {
        if (result.status === 'rejected') {
          errors.push({ source: label, message: result.reason?.message || 'Request failed' })
        }
      }

      quote = quoteData.status === 'fulfilled' && quoteData.value.success ? quoteData.value : null
      news = newsData.status === 'fulfilled' && newsData.value.success ? newsData.value : null
      ratings = ratingsData.status === 'fulfilled' && ratingsData.value.success ? ratingsData.value : null

      if (profileData.status === 'fulfilled' && profileData.value?.success) {
        profile = profileData.value.data
      } else {
        errors.push({ source: 'profile', message: profileData.status === 'rejected' ? profileData.reason?.message || 'Request failed' : profileData.value?.message || 'Profile unavailable' })
      }

      if (!quote && !news && !ratings) {
        return res.status(502).json(createError(
          API_ERRORS.UPSTREAM_ERROR,
          'Failed to fetch stock data from StockAnalysis',
          { errors }
        ))
      }
    }

    const payload = {
      success: true,
      cached: false,
      fetchedAt: new Date().toISOString(),
      type: parsed.type,
      code: parsed.code,
      symbol: quote?.data?.symbol || ratings?.symbol || parsed.code.toUpperCase(),
      name: quote?.data?.name || ratings?.name || null,
      profile,
      quote: quote?.data || null,
      ratings,
      news,
      unsupported,
      errors
    }

    cacheSet(cacheKey, payload, parsed.type === 'idx' ? 180 : 120)
    return res.status(200).json(payload)
  } catch (error) {
    return res.status(500).json(createError(
      API_ERRORS.UPSTREAM_ERROR,
      'Failed to build stock detail response',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ))
  }
}
