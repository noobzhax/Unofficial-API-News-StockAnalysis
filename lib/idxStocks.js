export const IDX_STOCKS = [
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Financials' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Persero Tbk', sector: 'Financials' },
  { symbol: 'BMRI', name: 'Bank Mandiri Persero Tbk', sector: 'Financials' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia Persero Tbk', sector: 'Financials' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Persero Tbk', sector: 'Telecommunication' },
  { symbol: 'ASII', name: 'Astra International Tbk', sector: 'Industrials' },
  { symbol: 'UNVR', name: 'Unilever Indonesia Tbk', sector: 'Consumer Staples' },
  { symbol: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', sector: 'Consumer Staples' },
  { symbol: 'INDF', name: 'Indofood Sukses Makmur Tbk', sector: 'Consumer Staples' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', sector: 'Technology' },
  { symbol: 'BUKA', name: 'Bukalapak.com Tbk', sector: 'Technology' },
  { symbol: 'ADRO', name: 'Adaro Energy Indonesia Tbk', sector: 'Energy' },
  { symbol: 'PTBA', name: 'Bukit Asam Tbk', sector: 'Energy' },
  { symbol: 'ITMG', name: 'Indo Tambangraya Megah Tbk', sector: 'Energy' },
  { symbol: 'ANTM', name: 'Aneka Tambang Tbk', sector: 'Materials' },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold Tbk', sector: 'Materials' },
  { symbol: 'INCO', name: 'Vale Indonesia Tbk', sector: 'Materials' },
  { symbol: 'TINS', name: 'Timah Tbk', sector: 'Materials' },
  { symbol: 'AMMN', name: 'Amman Mineral Internasional Tbk', sector: 'Materials' },
  { symbol: 'BRPT', name: 'Barito Pacific Tbk', sector: 'Materials' },
  { symbol: 'TPIA', name: 'Chandra Asri Pacific Tbk', sector: 'Materials' },
  { symbol: 'CPIN', name: 'Charoen Pokphand Indonesia Tbk', sector: 'Consumer Staples' },
  { symbol: 'JPFA', name: 'Japfa Comfeed Indonesia Tbk', sector: 'Consumer Staples' },
  { symbol: 'MYOR', name: 'Mayora Indah Tbk', sector: 'Consumer Staples' },
  { symbol: 'KLBF', name: 'Kalbe Farma Tbk', sector: 'Healthcare' },
  { symbol: 'SIDO', name: 'Industri Jamu dan Farmasi Sido Muncul Tbk', sector: 'Healthcare' },
  { symbol: 'MIKA', name: 'Mitra Keluarga Karyasehat Tbk', sector: 'Healthcare' },
  { symbol: 'EXCL', name: 'XL Axiata Tbk', sector: 'Telecommunication' },
  { symbol: 'ISAT', name: 'Indosat Tbk', sector: 'Telecommunication' },
  { symbol: 'TOWR', name: 'Sarana Menara Nusantara Tbk', sector: 'Infrastructure' },
  { symbol: 'TBIG', name: 'Tower Bersama Infrastructure Tbk', sector: 'Infrastructure' },
  { symbol: 'JSMR', name: 'Jasa Marga Persero Tbk', sector: 'Infrastructure' },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara Tbk', sector: 'Energy' },
  { symbol: 'AKRA', name: 'AKR Corporindo Tbk', sector: 'Energy' },
  { symbol: 'MEDC', name: 'Medco Energi Internasional Tbk', sector: 'Energy' },
  { symbol: 'UNTR', name: 'United Tractors Tbk', sector: 'Industrials' },
  { symbol: 'SMGR', name: 'Semen Indonesia Persero Tbk', sector: 'Materials' },
  { symbol: 'INTP', name: 'Indocement Tunggal Prakarsa Tbk', sector: 'Materials' },
  { symbol: 'INKP', name: 'Indah Kiat Pulp & Paper Tbk', sector: 'Materials' },
  { symbol: 'TKIM', name: 'Pabrik Kertas Tjiwi Kimia Tbk', sector: 'Materials' },
  { symbol: 'ACES', name: 'Aspirasi Hidup Indonesia Tbk', sector: 'Consumer Cyclicals' },
  { symbol: 'MAPI', name: 'Mitra Adiperkasa Tbk', sector: 'Consumer Cyclicals' },
  { symbol: 'ERAA', name: 'Erajaya Swasembada Tbk', sector: 'Consumer Cyclicals' },
  { symbol: 'SCMA', name: 'Surya Citra Media Tbk', sector: 'Communication Services' },
  { symbol: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', sector: 'Communication Services' },
  { symbol: 'PWON', name: 'Pakuwon Jati Tbk', sector: 'Properties' },
  { symbol: 'BSDE', name: 'Bumi Serpong Damai Tbk', sector: 'Properties' },
  { symbol: 'CTRA', name: 'Ciputra Development Tbk', sector: 'Properties' },
  { symbol: 'SMRA', name: 'Summarecon Agung Tbk', sector: 'Properties' },
  { symbol: 'ARTO', name: 'Bank Jago Tbk', sector: 'Financials' },
  { symbol: 'BRIS', name: 'Bank Syariah Indonesia Tbk', sector: 'Financials' },
  { symbol: 'BTPS', name: 'Bank BTPN Syariah Tbk', sector: 'Financials' },
  { symbol: 'NISP', name: 'Bank OCBC NISP Tbk', sector: 'Financials' },
  { symbol: 'PNBN', name: 'Bank Pan Indonesia Tbk', sector: 'Financials' },
  { symbol: 'WBSA', name: 'Wahana Bisnis Sejahtera Tbk', sector: 'Industrials' }
]

export function searchIdxStocks(query, limit = 8) {
  const q = String(query || '').toLowerCase().replace(/^idx:/, '').trim()
  if (!q) return IDX_STOCKS.slice(0, limit)
  return IDX_STOCKS
    .filter((stock) =>
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q) ||
      stock.sector.toLowerCase().includes(q)
    )
    .slice(0, limit)
}
