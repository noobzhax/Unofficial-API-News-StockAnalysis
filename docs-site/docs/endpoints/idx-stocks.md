---
title: GET /api/idx/stocks
---

import ApiUrl from '@site/src/components/ApiUrl'

# GET `/api/idx/stocks`

Mengambil daftar saham Indonesia Stock Exchange (IDX) yang tersedia di aplikasi. Endpoint ini dapat digunakan untuk autocomplete, pencarian ticker IDX, dan validasi kode saham Indonesia.

## Method

`GET`

## URL

<ApiUrl path="/api/idx/stocks" />

**Format URL lengkap:**

```txt
https://<domain-vercel-kamu>/api/idx/stocks
```

**Contoh URL siap pakai:**

```txt
https://<domain-vercel-kamu>/api/idx/stocks?search=bbca&limit=5
https://<domain-vercel-kamu>/api/idx/stocks?search=bank&limit=10
https://<domain-vercel-kamu>/api/idx/stocks?limit=1000
```

## Query Parameters

| Parameter | Tipe | Required | Keterangan | Contoh |
| --- | --- | --- | --- | --- |
| `search` | `string` | Tidak | Filter berdasarkan kode saham atau nama perusahaan (case-insensitive) | `bbca`, `bank` |
| `limit` | `number` | Tidak | Maksimal jumlah data yang dikembalikan. Nilai maksimum: `1000` | `10` |

## Contoh Request

```bash
curl "https://<domain-vercel-kamu>/api/idx/stocks?search=bbca&limit=5"
```

## Success Response

```json
{
  "success": true,
  "total": 951,
  "filtered": 1,
  "returned": 1,
  "data": [
    {
      "symbol": "BBCA",
      "name": "Bank Central Asia Tbk",
      "sector": "Financials"
    }
  ],
  "fetchedAt": "2026-05-16T13:42:00.000Z"
}
```

## Error Response

```json
{
  "success": false,
  "message": "Method not allowed"
}
```

## Catatan

- Hanya mendukung method `GET`.
- Jika `search` tidak dikirim, endpoint mengembalikan daftar semua saham IDX hingga batas `limit`.
- `filtered` adalah jumlah hasil yang cocok sebelum `limit` diterapkan.
