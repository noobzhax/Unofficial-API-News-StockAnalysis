---
title: GET /api/idx/{code}/profile
---

import ApiUrl from '@site/src/components/ApiUrl'

# GET `/api/idx/{code}/profile`

Mengambil profil perusahaan untuk saham Indonesia Stock Exchange (IDX) dari StockAnalysis.

## Method

`GET`

## URL

<ApiUrl path="/api/idx/{code}/profile" />

**Format URL lengkap:**

```txt
https://<domain-vercel-kamu>/api/idx/{code}/profile
```

**Contoh URL siap pakai:**

```txt
https://<domain-vercel-kamu>/api/idx/bbca/profile
https://<domain-vercel-kamu>/api/idx/tlkm/profile
https://<domain-vercel-kamu>/api/idx/asii/profile
```

## URL Sumber

`https://stockanalysis.com/quote/idx/{code}/`

## Path Parameters

| Parameter | Tipe | Required | Keterangan | Contoh |
| --- | --- | --- | --- | --- |
| `code` | `string` | Ya | Kode saham IDX (case-insensitive) | `bbca`, `tlkm`, `asii` |

## Contoh Request

```bash
curl "https://<domain-vercel-kamu>/api/idx/bbca/profile"
```

## Success Response

```json
{
  "success": true,
  "source": "https://stockanalysis.com/quote/idx/bbca/",
  "fetchedAt": "2026-05-16T13:42:00.000Z",
  "data": {
    "exchange": "IDX",
    "symbol": "BBCA",
    "name": "Bank Central Asia Tbk",
    "currency": "IDR",
    "country": "Indonesia",
    "description": "PT Bank Central Asia Tbk provides banking and financial services...",
    "industry": "Banks",
    "sector": "Financials",
    "founded": "1957",
    "stockExchange": "Indonesia Stock Exchange",
    "tickerSymbol": "BBCA"
  }
}
```

## Error Response

### 404 Not Found

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "IDX stock code 'invalid' was not found",
  "source": "https://stockanalysis.com/quote/idx/invalid/"
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

## Catatan

- Hanya mendukung method `GET`.
- Mata uang profil IDX adalah `IDR`.
- Data profil diambil dari halaman quote IDX StockAnalysis.
