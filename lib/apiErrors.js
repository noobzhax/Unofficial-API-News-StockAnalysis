export const API_ERRORS = {
  UPSTREAM_BLOCKED: 'UPSTREAM_BLOCKED',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  PARSE_ERROR: 'PARSE_ERROR'
}

export function createError(code, message, details = {}) {
  return {
    success: false,
    code,
    message,
    ...details
  }
}

export function handleUpstreamError(response, url) {
  if (response.status === 403) {
    return createError(
      API_ERRORS.UPSTREAM_BLOCKED,
      'StockAnalysis blocked this request (Cloudflare protection)',
      { 
        sourceUrl: url,
        suggestion: 'Try again later or visit StockAnalysis.com directly',
        upstreamStatus: 403
      }
    )
  }
  if (response.status === 404) {
    return createError(
      API_ERRORS.NOT_FOUND,
      'Resource not found on StockAnalysis',
      { sourceUrl: url, upstreamStatus: 404 }
    )
  }
  if (response.status === 504 || response.status === 408) {
    return createError(
      API_ERRORS.UPSTREAM_TIMEOUT,
      'StockAnalysis request timed out',
      { sourceUrl: url, upstreamStatus: response.status }
    )
  }
  return createError(
    API_ERRORS.UPSTREAM_ERROR,
    `Upstream request failed with status ${response.status}`,
    { sourceUrl: url, upstreamStatus: response.status }
  )
}
