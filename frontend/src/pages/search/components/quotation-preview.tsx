import { useMemo } from 'react'
import type { Product, Customer } from '../helper/types'
import { COMPANY } from '@/services/config'
import { formatVnd, shortOem } from '@/lib/utils'

interface QuotationPreviewProps {
  products: Array<Product>
  customer: Customer
  quoteNumber: string
  quoteDate: string
}

export function QuotationPreview({
  products,
  customer,
  quoteNumber,
  quoteDate,
}: QuotationPreviewProps) {
  // Auto-select price based on customer type
  const getPrice = (p: Product): number => {
    switch (customer.phan_loai) {
      case 'VIP': return p.gia_vip ?? p.gia_dl_10 ?? 0
      case 'ƯU_ĐÃI': return p.gia_uu_dai ?? p.gia_dl_10 ?? 0
      case 'ĐẠI_LÝ': return p.gia_dai_ly ?? p.gia_dl_10 ?? 0
      default: return p.gia_dl_10 ?? 0
    }
  }

  const getPriceLabel = (): string => {
    switch (customer.phanLoai) {
      case 'VIP':
        return 'GIÁ VIP'
      case 'ƯU_ĐÃI':
        return 'GIÁ ƯU ĐÃI'
      case 'ĐẠI_LÝ':
        return 'GIÁ ĐẠI LÝ'
      default:
        return 'GIÁ ĐL+10%'
    }
  }

  const items = useMemo(
    () =>
      products.map((p) => {
        const donGia = getPrice(p)
        return { ...p, donGia, thanhTien: donGia }
      }),
    [products, customer],
  )

  const tongCong = items.reduce((sum, item) => sum + item.thanhTien, 0)

  return (
    <div className="bg-white text-[#1e293b] text-[11px] max-w-[210mm] mx-auto" id="quotation-print">
      {/* ---- Styles cho print ---- */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quotation-print, #quotation-print * { visibility: visible; }
          #quotation-print { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4; margin: 10mm; }
        }
        .quote-header { text-align:center; margin-bottom:18px; padding-bottom:14px; border-bottom:3px double #1a56db; }
        .quote-logo { font-size:28px; font-weight:800; color:#1a56db; letter-spacing:-.02em; }
        .quote-slogan { font-size:10px; color:#64748b; margin-top:2px; }
        .quote-company-info { font-size:9px; color:#64748b; margin-top:5px; line-height:1.5; }
        .quote-title { text-align:center; font-size:18px; font-weight:800; margin:16px 0; text-transform:uppercase; letter-spacing:.08em; }
        .quote-meta { display:flex; justify-content:space-between; font-size:10px; margin-bottom:14px; gap:10px; flex-wrap:wrap; }
        .meta-box { padding:8px 12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; flex:1; min-width:180px; }
        .meta-label { font-size:8px; color:#64748b; text-transform:uppercase; font-weight:600; margin-bottom:3px; }
        .meta-value { font-weight:600; }
        .quote-table { width:100%; border-collapse:collapse; margin:12px 0; font-size:9px; }
        .quote-table th { background:#1a56db; color:#fff; padding:6px 5px; font-size:8px; text-transform:uppercase; text-align:left; }
        .quote-table td { padding:4px 5px; border:1px solid #e2e8f0; vertical-align:top; }
        .quote-table .num { text-align:right; white-space:nowrap; }
        .quote-total { text-align:right; font-size:14px; font-weight:800; margin:14px 0; padding:8px 12px; background:#f0f4ff; border-radius:6px; }
        .quote-terms { font-size:8px; color:#64748b; margin:16px 0; padding:10px; background:#f8fafc; border-radius:6px; white-space:pre-line; border:1px solid #e2e8f0; }
        .quote-sign { display:flex; justify-content:space-between; margin-top:40px; font-size:10px; }
        .sign-box { text-align:center; min-width:140px; }
        .sign-line { border-top:1px solid #000; margin-top:40px; padding-top:6px; font-weight:600; }
      `}</style>

      {/* Header */}
      <div className="quote-header">
        <div className="quote-logo">{COMPANY.name}</div>
        <div className="quote-slogan">{COMPANY.slogan}</div>
        <div className="quote-company-info">
          📍 {COMPANY.address} · 📞 {COMPANY.phone} · ✉️ {COMPANY.email}<br />
          MST: {COMPANY.taxCode} · {COMPANY.bank}
        </div>
      </div>

      <div className="quote-title">BÁO GIÁ</div>

      {/* Meta */}
      <div className="quote-meta">
        <div className="meta-box">
          <div className="meta-label">Số báo giá / Ngày</div>
          <div className="meta-value">{quoteNumber} · {quoteDate}</div>
        </div>
        <div className="meta-box">
          <div className="meta-label">Khách hàng</div>
          <div className="meta-value">{customer.ten_kh}</div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>
            📞 {customer.dien_thoai} · 📍 {customer.dia_chi} · {customer.tinh_tp}
          </div>
        </div>
        <div className="meta-box">
          <div className="meta-label">Phân loại / Giá áp dụng</div>
          <div className="meta-value">{customer.phan_loai} — {getPriceLabel()}</div>
        </div>
      </div>

      {/* Product table */}
      <table className="quote-table">
        <thead>
          <tr>
            <th style={{ width: '28px' }}>#</th>
            <th>MÃ VT</th>
            <th>TÊN HÀNG / MODEL</th>
            <th>MÃ ĐỘNG CƠ</th>
            <th>OEM PART NO</th>
            <th>ĐẶC ĐIỂM</th>
            <th className="num" style={{ width: '100px' }}>ĐƠN GIÁ</th>
            <th className="num" style={{ width: '50px' }}>SL</th>
            <th className="num" style={{ width: '110px' }}>THÀNH TIỀN</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{item.ma_vt}</td>
              <td>{(item as any).ten_hang || item.model_turbo || '—'}</td>
              <td>{item.ma_dong_co || ''}</td>
              <td>{shortOem(item.oem_part_no || '')}</td>
              <td>{item.dac_diem || ''}</td>
              <td className="num">
                {item.donGia > 0 ? formatVnd(item.donGia) : <span style={{ color: '#999' }}>LH</span>}
              </td>
              <td className="num">1</td>
              <td className="num">
                {item.thanhTien > 0 ? formatVnd(item.thanhTien) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="quote-total">
        TỔNG CỘNG: {tongCong > 0 ? formatVnd(tongCong) : 'Liên hệ'}
      </div>
      <div style={{ textAlign: 'right', fontSize: '9px', color: '#64748b' }}>
        ({tongCong > 0 ? 'Bằng chữ: ...' : 'Vui lòng liên hệ để có giá tốt nhất'})
      </div>

      {/* Terms */}
      <div className="quote-terms">
        <strong>Điều khoản:</strong>{'\n'}{COMPANY.terms}{'\n\n'}
        <strong>Người nhận hàng:</strong> {customer.tenKh} — {customer.dienThoai}{'\n'}
        <strong>Nhà xe:</strong> {customer.nhaXe || 'Không có'}{'\n'}
        <strong>Ghi chú KH:</strong> {customer.ghiChu || 'Không có'}
      </div>

      {/* Signature */}
      <div className="quote-sign">
        <div className="sign-box">
          <div className="sign-line">KHÁCH HÀNG</div>
          <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>
            (Ký, ghi rõ họ tên)
          </div>
        </div>
        <div className="sign-box">
          <div className="sign-line">{COMPANY.signature}</div>
          <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>
            (Ký, đóng dấu)
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '8px', color: '#999' }}>
        🤖 Báo giá được tạo tự động — {quoteDate}
      </div>
    </div>
  )
}
