---
title: GET /api/stock/{code}/profile
---

import ApiUrl from '@site/src/components/ApiUrl'

# GET `/api/stock/{code}/profile`

Mengambil profil perusahaan untuk saham US dari StockAnalysis.

## Method

`GET`

## URL

<ApiUrl path="/api/stock/{code}/profile" />

**Format URL lengkap:**

```txt
https://<domain-vercel-kamu>/api/stock/{code}/profile
```

**Contoh URL siap pakai:**

```txt
https://<domain-vercel-kamu>/api/stock/nvda/profile
https://<domain-vercel-kamu>/api/stock/aapl/profile
https://<domain-vercel-kamu>/api/stock/tsla/profile
```

## URL Sumber

`https://stockanalysis.com/stocks/{code}/`

## Path Parameters

| Parameter | Tipe | Required | Keterangan | Contoh |
| --- | --- | --- | --- | --- |
| `code` | `string` | Ya | Kode saham US (case-insensitive) | `nvda`, `aapl`, `tsla` |

## Contoh Request

```bash
curl "https://<domain-vercel-kamu>/api/stock/nvda/profile"
```

## Success Response

```json
{
  "success": true,
  "source": "https://stockanalysis.com/stocks/nvda/",
  "fetchedAt": "2026-05-16T13:42:00.000Z",
  "data": {
    "symbol": "NVDA",
    "name": "NVIDIA Corporation",
    "exchange": "NASDAQ",
    "currency": "USD",
    "country": "United States",
    "description": "NVIDIA Corporation provides graphics and compute and networking solutions...",
    "industry": "Semiconductors",
    "sector": "Technology",
    "website": "https://www.nvidia.com",
    "employees": 36000,
    "founded": "1993",
    "ceo": "Jensen Huang",
    "headquarters": "Santa Clara, CA"
  }
}
```

## Error Response

### 404 Not Found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Stock 'invalid' not found",
  "source": "https://stockanalysis.com/stocks/invalid/"
}
```

### 405 Method Not Allowed

```json
{
  "success": false,
  "code": "INVALID_REQUEST",
  "message": "Method not allowed"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "code": "UPSTREAM_ERROR",
  "message": "Failed to fetch US stock profile",
  "error": "Error message details",
  "source": "https://stockanalysis.com/stocks/nvda/"
}
```

## Catatan

- Hanya mendukung method `GET`.
- Mata uang profil US adalah `USD`.
- Field `website`, `employees`, `founded`, `ceo`, dan `headquarters` bisa `null` jika tidak tersedia di halaman sumber.
