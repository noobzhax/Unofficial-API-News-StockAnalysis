import { REQUEST_HEADERS } from './requestHeaders.js'

/**
 * Fetch a URL with automatic retries and an AbortController timeout.
 *
 * @param {string} url
 * @param {RequestInit} options  - Additional fetch options (merged with defaults)
 * @param {number} retries       - Number of retry attempts after the first failure (default 2)
 * @param {number} timeoutMs     - Per-attempt timeout in milliseconds (default 10000)
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 10000) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        headers: REQUEST_HEADERS,
        cache: 'no-store',
        ...options,
        signal: controller.signal
      })
      clearTimeout(timer)
      return response
    } catch (err) {
      clearTimeout(timer)
      lastError = err
      // Don't retry on abort (timeout) for the last attempt
      if (attempt === retries) break
      // Brief back-off before retry: 300ms * (attempt + 1)
      await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }

  throw lastError
}

export default fetchWithRetry
