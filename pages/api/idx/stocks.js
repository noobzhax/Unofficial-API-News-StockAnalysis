import { IDX_STOCKS } from '../../../lib/idxStocks.js'

const MAX_LIMIT = 1000

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const search = String(req.query.search || '').trim().toLowerCase()
  const requestedLimit = Number.parseInt(req.query.limit, 10)
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_LIMIT)
    : MAX_LIMIT

  const filteredStocks = search
    ? IDX_STOCKS.filter(stock => {
        const symbol = String(stock.symbol || '').toLowerCase()
        const name = String(stock.name || '').toLowerCase()
        return symbol.includes(search) || name.includes(search)
      })
    : IDX_STOCKS

  const data = filteredStocks.slice(0, limit)

  return res.status(200).json({
    success: true,
    total: IDX_STOCKS.length,
    filtered: filteredStocks.length,
    returned: data.length,
    data,
    fetchedAt: new Date().toISOString()
  })
}
