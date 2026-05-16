import vm from 'node:vm'

export function stripTags(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return stripTags(h1?.[1]) || null
}

export function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
  return stripTags(match?.[1]) || null
}

export function extractStat(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<td[^>]*>\\s*(?:<[^>]+>)*\\s*${escaped}\\s*(?:<[^>]+>)*\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i'),
    new RegExp(`<div[^>]*>\\s*(?:<[^>]+>)*\\s*${escaped}\\s*(?:<[^>]+>)*\\s*<\\/div>\\s*<div[^>]*>([\\s\\S]*?)<\\/div>`, 'i')
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    const value = stripTags(match?.[1])
    if (value) return value
  }

  return null
}

/**
 * Attempt to extract and evaluate a Next.js __NEXT_DATA__ or similar hydration
 * payload from the HTML. Returns the parsed object or null if not found/parseable.
 */
export function extractHydrationPayload(html) {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    // fallback: try vm sandbox eval for non-standard payloads
    try {
      const sandbox = {}
      vm.createContext(sandbox)
      vm.runInContext(`result = ${match[1]}`, sandbox)
      return sandbox.result ?? null
    } catch {
      return null
    }
  }
}
