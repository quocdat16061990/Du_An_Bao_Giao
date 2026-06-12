import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer'
import type { Product, Customer } from '../helper/types'
import { COMPANY } from '@/services/config'

// ── Font: Arial từ local (hỗ trợ tiếng Việt đầy đủ) ──
Font.register({
  family: 'ArialVN',
  fonts: [
    { src: '/fonts/arial.ttf', fontWeight: 400 },
    { src: '/fonts/arialbd.ttf', fontWeight: 700 },
  ],
})

// ── Styles ──
const styles = StyleSheet.create({
  page: {
    padding: '40 50 30 50',
    fontSize: 10,
    fontFamily: 'ArialVN',
    color: '#1e293b',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 15,
    borderBottom: '3 double #1a56db',
  },
  logo: {
    fontSize: 26,
    fontWeight: 800,
    color: '#1a56db',
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  companyInfo: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 1.6,
  },
  // Title
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginVertical: 16,
    color: '#0f172a',
  },
  // Client box
  clientBox: {
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
    borderRadius: 6,
    padding: '10 14',
    marginBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  clientRow: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 2,
  },
  clientLabel: {
    fontSize: 8,
    color: '#64748b',
    width: 65,
    fontWeight: 600,
  },
  clientValue: {
    fontSize: 9,
    fontWeight: 600,
    color: '#1e293b',
  },
  // Table
  table: {
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    padding: '6 8',
    borderRadius: 0,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: '5 8',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
  },
  // Column widths
  colStt: { width: '4%' },
  colMaVt: { width: '12%' },
  colTenHang: { width: '23%' },
  colModel: { width: '14%' },
  colDongCo: { width: '12%' },
  colOem: { width: '10%' },
  colDonGia: { width: '13%', textAlign: 'right' },
  colSl: { width: '4%', textAlign: 'center' },
  colThanhTien: { width: '13%', textAlign: 'right' },
  // Price badge
  priceBadge: {
    fontSize: 6,
    padding: '1 4',
    borderRadius: 3,
    marginLeft: 3,
  },
  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    padding: '8 12',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1e293b',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 800,
    color: '#1e3a5f',
  },
  // Terms
  terms: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 14,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    border: '1 solid #e2e8f0',
    lineHeight: 1.5,
  },
  termsTitle: {
    fontWeight: 700,
    color: '#334155',
  },
  // Signature
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 10,
  },
  sigBox: {
    width: '40%',
    textAlign: 'center',
  },
  sigName: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 35,
    paddingTop: 5,
    borderTop: '1 solid #000',
  },
  sigSub: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 4,
  },
  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 20,
  },
  // Right align helper
  right: { textAlign: 'right' },
  center: { textAlign: 'center' },
  bold: { fontWeight: 700 },
  price: { fontFamily: 'ArialVN', fontWeight: 700 },
})

// ── Helpers ──
function formatVnd(n: number | null): string {
  if (!n) return 'LH'
  return n.toLocaleString('vi-VN') + ' ₫'
}

function getPrice(p: Product, customerPhanLoai: string): number {
  switch (customerPhanLoai) {
    case 'VIP': return p.gia_vip ?? p.gia_dl_10 ?? 0
    case 'ƯU_ĐÃI': return p.gia_uu_dai ?? p.gia_dl_10 ?? 0
    case 'ĐẠI_LÝ': return p.gia_dai_ly ?? p.gia_dl_10 ?? 0
    default: return p.gia_dl_10 ?? 0
  }
}

function getPriceLabel(customerPhanLoai: string): string {
  switch (customerPhanLoai) {
    case 'VIP': return 'GIÁ VIP'
    case 'ƯU_ĐÃI': return 'GIÁ ƯU ĐÃI'
    case 'ĐẠI_LÝ': return 'GIÁ ĐẠI LÝ'
    default: return 'GIÁ ĐL+10%'
  }
}

function shortOem(oem: string): string {
  if (!oem) return ''
  return oem.split(/[/\n]/)[0].trim()
}

// ── Component ──
interface QuotationPDFProps {
  products: Array<Product>
  customer: Customer
  quoteNumber: string
  quoteDate: string
}

export function QuotationPDF({ products, customer, quoteNumber, quoteDate }: QuotationPDFProps) {
  const priceLabel = getPriceLabel(customer.phan_loai)
  const items = products.map((p) => {
    const donGia = getPrice(p, customer.phan_loai)
    return { ...p, donGia, thanhTien: donGia }
  })
  const tongCong = items.reduce((sum, i) => sum + i.thanhTien, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{COMPANY.name}</Text>
            <Text style={styles.slogan}>{COMPANY.slogan}</Text>
          </View>
          <View>
            <Text style={styles.companyInfo}>Địa chỉ: {COMPANY.address}</Text>
            <Text style={styles.companyInfo}>ĐT: {COMPANY.phone}  |  Email: {COMPANY.email}</Text>
            <Text style={styles.companyInfo}>MST: {COMPANY.taxCode}</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>BÁO GIÁ</Text>

        {/* ── Quote meta ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Số: {quoteNumber}</Text>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Ngày: {quoteDate}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Giá áp dụng: <Text style={{ fontWeight: 700, color: '#1e3a5f' }}>{priceLabel}</Text></Text>
          </View>
        </View>

        {/* ── Client Info ── */}
        <View style={styles.clientBox} wrap={false}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Tên KH:</Text>
            <Text style={styles.clientValue}>{customer.ten_kh}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Điện thoại:</Text>
            <Text style={styles.clientValue}>{customer.dien_thoai || '—'}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Địa chỉ:</Text>
            <Text style={styles.clientValue}>{customer.dia_chi || '—'}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Tỉnh/TP:</Text>
            <Text style={styles.clientValue}>{customer.tinh_tp || '—'}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Phân loại:</Text>
            <Text style={styles.clientValue}>{customer.phan_loai}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Nhà xe:</Text>
            <Text style={styles.clientValue}>{customer.nha_xe_name || '—'}</Text>
          </View>
        </View>

        {/* ── Product Table ── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colStt]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colMaVt]}>Mã VT</Text>
            <Text style={[styles.tableHeaderCell, styles.colTenHang]}>Tên hàng</Text>
            <Text style={[styles.tableHeaderCell, styles.colModel]}>Model</Text>
            <Text style={[styles.tableHeaderCell, styles.colDongCo]}>Động cơ</Text>
            <Text style={[styles.tableHeaderCell, styles.colOem]}>OEM</Text>
            <Text style={[styles.tableHeaderCell, styles.colDonGia]}>Đơn giá</Text>
            <Text style={[styles.tableHeaderCell, styles.colSl]}>SL</Text>
            <Text style={[styles.tableHeaderCell, styles.colThanhTien]}>Thành tiền</Text>
          </View>
          {/* Rows */}
          {items.map((item, i) => (
            <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
              <Text style={[styles.tableCell, styles.colStt, styles.center]}>{i + 1}</Text>
              <Text style={[styles.tableCell, styles.colMaVt, styles.bold]}>{item.ma_vt}</Text>
              <Text style={[styles.tableCell, styles.colTenHang]}>{(item as any).ten_hang || item.model_turbo || '—'}</Text>
              <Text style={[styles.tableCell, styles.colModel]}>{item.model_turbo}</Text>
              <Text style={[styles.tableCell, styles.colDongCo]}>{item.ma_dong_co}</Text>
              <Text style={[styles.tableCell, styles.colOem]}>{shortOem(item.oem_part_no)}</Text>
              <Text style={[styles.tableCell, styles.colDonGia, styles.price]}>{formatVnd(item.donGia)}</Text>
              <Text style={[styles.tableCell, styles.colSl, styles.center]}>1</Text>
              <Text style={[styles.tableCell, styles.colThanhTien, styles.price]}>{formatVnd(item.thanhTien)}</Text>
            </View>
          ))}
        </View>

        {/* ── Total ── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>
          <Text style={styles.totalValue}>{formatVnd(tongCong)}</Text>
        </View>

        {/* ── Terms ── */}
        <View style={styles.terms}>
          <Text style={styles.termsTitle}>Điều khoản:</Text>
          <Text>{COMPANY.terms}</Text>
        </View>

        {/* ── Signature ── */}
        <View style={styles.signature}>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{COMPANY.signature}</Text>
            <Text style={styles.sigSub}>(Ký, đóng dấu)</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>KHÁCH HÀNG</Text>
            <Text style={styles.sigSub}>(Ký, ghi rõ họ tên)</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          Báo giá được tạo tự động — {quoteDate} — {COMPANY.name}
        </Text>
      </Page>
    </Document>
  )
}

// ── Export as blob (for download) ──
export async function generateQuotationPdf(
  products: Array<Product>,
  customer: Customer,
  quoteNumber: string,
  quoteDate: string,
): Promise<Blob> {
  const doc = (
    <QuotationPDF
      products={products}
      customer={customer}
      quoteNumber={quoteNumber}
      quoteDate={quoteDate}
    />
  )
  return pdf(doc).toBlob()
}
