# Kế Hoạch Xây Dựng TURBO DIESEL - Hệ Thống Báo Giá & Tra Cứu Sản Phẩm

> **Trạng thái**: CHỜ DUYỆT
> **Ngày**: 2026-06-10

---

## I. Bài Toán

Hiện tại đang dùng 1 script Python (`generate-html-report.py`) đọc file Excel BÁO GIÁ TURBO và sinh ra 1 file HTML thuần với search + pagination + tạo báo giá. Muốn chuyển thành web app chuẩn:

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + **ShadCN UI** |
| Backend | Django + Django REST Framework |
| Data Fetching | **TanStack Query** (React Query v5) — KHÔNG SWR |
| Form / Validate | React Hook Form + Zod |
| State (UI) | Zustand |
| Styling | Tailwind CSS + ShadCN UI + `cn()` helper |
| Lint | ESLint `no-explicit-any: error` + `strict: true` (CẤM `any`) |
| Auth | **Bỏ qua** (chưa làm login) |
| Icons | `lucide-react` |

---

## II. Dữ Liệu Gốc (Từ File Excel)

File Excel **BÁO GIÁ TURBO** có cấu trúc:

### Sheet 1-4: BÁO GIÁ (sản phẩm)
| Cột | Tên | Mô tả |
|-----|-----|-------|
| A | STT | Số thứ tự |
| B | MÃ VT | Mã vật tư |
| C | TÊN SP | Tên sản phẩm |
| D | MODEL TURBO | Model turbo |
| E | MÃ ĐỘNG CƠ | Mã động cơ |
| F | OEM PART NO | Mã OEM |
| G | ĐẶC ĐIỂM | Đặc điểm |
| H | ỨNG DỤNG | Ứng dụng |
| I | HÌNH ẢNH | Link ảnh |
| J | GIÁ CHUNG | Giá chung |
| K | GIÁ VIP | Giá VIP |
| L | GIÁ ƯU ĐÃI | Giá ưu đãi |
| M | GIÁ ĐẠI LÝ | Giá đại lý |
| N | GIÁ ĐL+10% | Giá đại lý + 10% |

### Sheet 5: DANH SÁCH KH (khách hàng)
| Cột | Tên |
|-----|-----|
| A | STT |
| B | Mã KH |
| C | Tên KH |
| D | ĐT |
| E | Phân loại (VIP / ƯU ĐÃI / ĐẠI LÝ) |
| F | Địa chỉ |
| G | Tỉnh/TP |
| H | Ghi chú |
| I | Nhà xe |

---

## III. Cấu Trúc Thư Mục

```
elearning-project/
├── backend/                              # Django Backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── backend/                          # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py                   # DRF + CORS config
│   │   ├── urls.py                       # /api/v1/...
│   │   └── wsgi.py
│   ├── products/                         # App: sản phẩm
│   │   ├── __init__.py
│   │   ├── models.py                     # Product, Customer
│   │   ├── serializers.py                # DRF Serializers
│   │   ├── views.py                      # Search + Filter + Quotation API
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── management/
│   │   │   └── commands/
│   │   │       ├── import_excel.py       # Import từ file Excel
│   │   │       └── seed_data.py          # Seed data mẫu nếu ko có Excel
│   │   └── migrations/
│   └── media/                            # Upload Excel files (optional)
│
├── frontend/                             # React Frontend
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json                     # strict: true, noImplicitAny: true
│   ├── eslint.config.js                  # Flat config - CẤM any
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── components.json                   # ShadCN UI config
│   ├── .env.example
│   ├── public/
│   │   └── logo.png
│   └── src/
│       ├── main.tsx                      # Entry point
│       ├── App.tsx                       # QueryClientProvider + BrowserRouter
│       ├── index.css                     # Tailwind + ShadCN CSS vars
│       │
│       ├── router/
│       │   └── index.tsx                 # Routes
│       │
│       ├── pages/
│       │   └── search/                   # TRANG SEARCH CHÍNH
│       │       ├── index.tsx             # Entry page (layout chính)
│       │       ├── components/
│       │       │   ├── search-bar.tsx            # Thanh search chính
│       │       │   ├── filter-panel.tsx          # Panel lọc trái
│       │       │   ├── filter-sheet.tsx          # Mobile filter (ShadCN Sheet)
│       │       │   ├── product-table.tsx         # Bảng sản phẩm (desktop)
│       │       │   ├── product-card.tsx          # Card sản phẩm (mobile)
│       │       │   ├── product-grid.tsx          # Grid card sản phẩm
│       │       │   ├── customer-search.tsx       # Search khách hàng
│       │       │   ├── quotation-dialog.tsx      # Dialog tạo báo giá
│       │       │   ├── quotation-preview.tsx     # Preview báo giá
│       │       │   ├── empty-state.tsx           # Empty state
│       │       │   ├── search-skeleton.tsx       # Loading skeleton
│       │       │   ├── pagination-bar.tsx        # Phân trang
│       │       │   └── export-bar.tsx            # Toolbar export
│       │       ├── helper/
│       │       │   ├── use-search.ts             # TanStack Query hook
│       │       │   ├── use-customers.ts          # Customer search hook
│       │       │   ├── types.ts                  # TypeScript types
│       │       │   └── constants.ts              # Filter options
│       │       └── store/
│       │           └── index.ts                  # Zustand: selected products
│       │
│       ├── components/
│       │   └── ui/                       # ShadCN UI components
│       │       ├── button.tsx
│       │       ├── input.tsx
│       │       ├── badge.tsx
│       │       ├── card.tsx
│       │       ├── skeleton.tsx
│       │       ├── checkbox.tsx
│       │       ├── select.tsx
│       │       ├── sheet.tsx
│       │       ├── dialog.tsx
│       │       ├── command.tsx            # Search autocomplete
│       │       ├── popover.tsx
│       │       ├── slider.tsx
│       │       ├── separator.tsx
│       │       ├── scroll-area.tsx
│       │       └── table.tsx
│       │
│       ├── lib/
│       │   ├── utils.ts                  # cn() helper
│       │   └── api/
│       │       └── client.ts             # Axios instance
│       │
│       ├── services/
│       │   └── config.ts                 # API_BASE_URL, constants
│       │
│       └── hook/
│           └── use-debounce.ts           # Debounce hook
│
└── PLAN.md                               # File này
```

---

## IV. Backend - Django API

### 4.1 Models

**Product** (sản phẩm turbo):
| Field | Type | Mô tả |
|-------|------|-------|
| id | AutoField | PK |
| ma_vt | CharField(100) | Mã vật tư |
| ten_sp | CharField(300) | Tên sản phẩm |
| model_turbo | CharField(200) | Model turbo |
| ma_dong_co | CharField(200) | Mã động cơ |
| oem_part_no | TextField | OEM Part Number |
| dac_diem | TextField | Đặc điểm |
| ung_dung | TextField | Ứng dụng |
| hinh_anh | URLField | Link ảnh |
| gia_chung | DecimalField | Giá chung |
| gia_vip | DecimalField | Giá VIP |
| gia_uu_dai | DecimalField | Giá ưu đãi |
| gia_dai_ly | DecimalField | Giá đại lý |
| gia_dl_10 | DecimalField | Giá ĐL+10% |
| sheet_name | CharField(50) | Tên sheet gốc |
| is_featured | BooleanField | Sản phẩm nổi bật |
| created_at | DateTimeField | Ngày import |

**Customer** (khách hàng):
| Field | Type | Mô tả |
|-------|------|-------|
| id | AutoField | PK |
| ma_kh | CharField(50) | Mã khách hàng |
| ten_kh | CharField(200) | Tên khách hàng |
| dien_thoai | CharField(20) | Số điện thoại |
| phan_loai | CharField(20) | VIP / ƯU ĐÃI / ĐẠI LÝ / KHÁC |
| dia_chi | TextField | Địa chỉ |
| tinh_tp | CharField(100) | Tỉnh/TP |
| ghi_chu | TextField | Ghi chú |
| nha_xe | CharField(200) | Nhà xe |

### 4.2 API Endpoints

```
# Products
GET    /api/v1/products/                # List products (paginated, search, filter)
GET    /api/v1/products/<id>/           # Product detail
GET    /api/v1/products/stats/          # Thống kê: tổng SP, theo sheet, khoảng giá

# Customers
GET    /api/v1/customers/               # List customers
GET    /api/v1/customers/search/        # Search customer (autocomplete)

# Quotation
POST   /api/v1/quotations/preview/      # Tạo HTML báo giá từ selected products + customer
POST   /api/v1/quotations/export-csv/   # Export CSV từ selected products

# Excel Import (admin)
POST   /api/v1/import/excel/            # Upload & import Excel file
```

### 4.3 Search API (Products)

**Params cho `GET /api/v1/products/`:**

| Param | Type | Mô tả |
|-------|------|-------|
| `q` | string | Search trong: ma_vt, ten_sp, model_turbo, ma_dong_co, oem_part_no, dac_diem, ung_dung |
| `phan_loai_gia` | string | Lọc theo loại giá: `vip` / `uu_dai` / `dai_ly` / `dl_10` |
| `min_price` | number | Giá tối thiểu |
| `max_price` | number | Giá tối đa |
| `sheet` | string | Lọc theo sheet gốc |
| `is_featured` | bool | SP nổi bật |
| `ordering` | string | `price` / `-price` / `ma_vt` / `-created_at` |
| `page` | int | Trang |
| `page_size` | int | Số dòng / trang (default 50) |

### 4.4 Import Excel

Dùng `openpyxl` hoặc thư viện `xlrd` + `zipfile` để đọc file Excel upload lên, parse các sheet và import vào DB. Giữ nguyên logic từ script gốc.

---

## V. Frontend - Trang Search

### 5.1 UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 TURBO DIESEL  │  Số SP: 1,234  │  🔍 [Tìm mã VT, model...] │  ← Header
├────────────┬─────────────────────────────────────────────────────┤
│  BỘ LỌC    │  Kết quả: 234 sản phẩm    Sắp xếp: [Mới nhất ▾]   │
│            │                                                     │
│  🔎 Tìm     │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  [________] │  │ ☑ Chọn   │ │ ☐ Chọn   │ │ ☐ Chọn   │          │
│            │  │ MÃ VT:... │ │ MÃ VT:... │ │ MÃ VT:... │          │  ← Product Cards
│  📊 Loại giá│  │ Model...  │ │ Model...  │ │ Model...  │          │
│  ☐ VIP     │  │ OEM:...   │ │ OEM:...   │ │ OEM:...   │          │
│  ☐ Ưu đãi  │  │ ĐC:...    │ │ ĐC:...    │ │ ĐC:...    │          │
│  ☐ Đại lý  │  │ 💰 5.5Tr  │ │ 💰 2.1Tr  │ │ 💰 8.0Tr  │          │
│  ☐ ĐL+10%  │  └──────────┘ └──────────┘ └──────────┘          │
│            │                                                     │
│  💰 Giá    │  ... more cards ...                                │
│  [0]─[20Tr]│                                                     │
│            │  [1] [2] [3] ... [10] →                             │  ← Pagination
│  📋 Sheet  │                                                     │
│  ☐ Sheet1  │                                                     │
│  ☐ Sheet2  │  ┌──────────────────────────────────────────┐     │
│            │  │ Export Bar                                │     │
│  [Xóa lọc] │  │ ☑ Đã chọn: 3 SP  │ 👤 [Tìm KH___]       │     │
│            │  │ [📄 Tạo Báo Giá] [📥 Excel] [🖨️ PDF]     │     │
│            │  └──────────────────────────────────────────┘     │
└────────────┴─────────────────────────────────────────────────────┘
```

### 5.2 Components Chi Tiết

#### SearchBar (`search-bar.tsx`)
- Input lớn với icon `Search` (lucide-react)
- Debounce 300ms trước khi gọi API
- Có nút `X` clear khi đã nhập text
- Animation focus: ring-primary/50 + scale 1.01
- Hiển thị số kết quả tìm thấy

#### FilterPanel (`filter-panel.tsx`) — Desktop sidebar
- **Ô search nhanh** — input riêng filter
- **Loại giá** — ShadCN Checkbox: VIP, Ưu đãi, Đại lý, ĐL+10%
- **Khoảng giá** — ShadCN Slider 2 đầu (min-max)
- **Sheet gốc** — Checkbox theo sheet
- Nút **"Xóa bộ lọc"** — reset tất cả
- Sticky khi scroll

#### FilterSheet (`filter-sheet.tsx`) — Mobile
- ShadCN Sheet component — trượt từ trái
- Cùng nội dung FilterPanel nhưng trong sheet

#### ProductTable (`product-table.tsx`) — Desktop view
- ShadCN Table component
- Cột: ☑ chọn, Mã VT, Tên SP, Model, OEM, Đặc điểm, Ứng dụng, **Giá**
- Mỗi dòng có checkbox để chọn
- Row màu: vàng (VIP), cam (Ưu đãi), xanh (Đại lý)
- Click row → mở dialog chi tiết

#### ProductCard (`product-card.tsx`) — Mobile/Grid view
- Card đẹp với: ảnh (nếu có), Mã VT, Model, OEM ngắn, Đặc điểm, **Giá**
- Badge loại giá: `VIP`, `ƯU ĐÃI`, `ĐẠI LÝ`
- Checkbox chọn sản phẩm
- Hover: scale(1.02) + shadow-lg + transition

#### ProductGrid (`product-grid.tsx`)
- Grid responsive: 1 col mobile, 2 cols tablet, 3 cols desktop
- Render list ProductCard

#### CustomerSearch (`customer-search.tsx`)
- ShadCN Command component (autocomplete)
- Gõ tên/SĐT → dropdown gợi ý KH
- Hiển thị: Tên KH + tag VIP/ƯU ĐÃI/ĐẠI LÝ + SĐT + Địa chỉ
- Chọn KH → lưu vào state

#### QuotationDialog (`quotation-dialog.tsx`)
- ShadCN Dialog
- Preview báo giá: header TURBO DIESEL + thông tin KH + bảng SP chọn + giá + tổng tiền
- Nút: In (window.print) / Xuất CSV

#### ExportBar (`export-bar.tsx`)
- Fixed bottom bar (sticky)
- Hiển thị số SP đã chọn
- CustomerSearch (chọn KH)
- Nút: "Tạo Báo Giá" (mở dialog) / "Xuất Excel" / "In PDF"

#### EmptyState (`empty-state.tsx`)
- Icon `PackageSearch` (lucide-react)
- "Không tìm thấy sản phẩm nào"
- Gợi ý: "Thử tìm với từ khóa khác hoặc xóa bộ lọc"

#### SearchSkeleton (`search-skeleton.tsx`)
- ShadCN Skeleton — 6-8 skeletons
- Layout giống ProductCard/Table

#### PaginationBar (`pagination-bar.tsx`)
- ShadCN Pagination pattern
- « ‹ 1 2 3 ... 10 › »
- Hiển thị "Trang X / Y · Z kết quả"

### 5.3 Custom Hooks

**useSearch** (`helper/use-search.ts`):
```typescript
import { useQuery } from '@tanstack/react-query';
// Key: ['products', 'search', searchParams]
// QueryFn: GET /api/v1/products/ với params
// Trả về: PaginatedResponse<Product>
```

**useCustomers** (`helper/use-customers.ts`):
```typescript
import { useQuery } from '@tanstack/react-query';
// Key: ['customers', 'search', query]
// QueryFn: GET /api/v1/customers/search/?q=...
// Enabled khi query.length >= 1
// Trả về: Customer[]
```

**useDebounce** (`hook/use-debounce.ts`):
```typescript
// Debounce value sau N ms (default 300)
```

### 5.4 Zustand Store

```typescript
// store/index.ts
interface SearchStore {
  // Selected products
  selectedProductIds: Set<number>;
  toggleProduct: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  
  // Selected customer
  selectedCustomer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  
  // Quotation dialog
  isQuotationOpen: boolean;
  openQuotation: () => void;
  closeQuotation: () => void;
}
```

### 5.5 TypeScript Types — KHÔNG `any`

```typescript
// types.ts
interface Product {
  id: number;
  maVt: string;
  tenSp: string;
  modelTurbo: string;
  maDongCo: string;
  oemPartNo: string;
  dacDiem: string;
  ungDung: string;
  hinhAnh: string;
  giaChung: number | null;
  giaVip: number | null;
  giaUuDai: number | null;
  giaDaiLy: number | null;
  giaDl10: number | null;
  sheetName: string;
  isFeatured: boolean;
  createdAt: string;
}

type PhanLoai = 'VIP' | 'ƯU_ĐÃI' | 'ĐẠI_LÝ' | 'KHÁC';

interface Customer {
  id: number;
  maKh: string;
  tenKh: string;
  dienThoai: string;
  phanLoai: PhanLoai;
  diaChi: string;
  tinhTp: string;
  ghiChu: string;
  nhaXe: string;
}

interface SearchParams {
  q?: string;
  phanLoaiGia?: string;
  minPrice?: number;
  maxPrice?: number;
  sheet?: string;
  isFeatured?: boolean;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface QuotationRequest {
  productIds: number[];
  customerId: number;
}

interface QuotationResponse {
  html: string;
  totalAmount: number;
}
```

---

## VI. Thiết Kế Visual

### Màu sắc chủ đạo:
| Token | Màu | Dùng cho |
|-------|-----|----------|
| Primary | `#1a56db` (Xanh dương đậm) | Header, buttons, links |
| Gold | `#f59e0b` | Row VIP, badge VIP |
| Orange | `#f97316` | Row Ưu đãi, badge Ưu đãi |
| Green | `#22c55e` | Row Đại lý, badge Đại lý |
| Background | `#f1f5f9` | Nền trang |
| Card | `#ffffff` | Card, table |
| Text | `#1e293b` | Text chính |

### Header:
```
┌──────────────────────────────────────────────────────────────┐
│  🔧 TURBO DIESEL    Chuyên Cung Cấp Turbo & Phụ Tùng Động Cơ │
│                      📞 09xx.xxx.xxx · ✉️ email@turbodiesel.com │
│  [Trang chủ]  [Sản phẩm]  [Khách hàng]  [Báo giá]            │
└──────────────────────────────────────────────────────────────┘
```

### Responsive:
- **Mobile** (< 768px): Filter trong Sheet, Product dạng Card 1 cột, ExportBar simplified
- **Tablet** (768-1024px): Filter sidebar thu gọn, 2 cột card
- **Desktop** (> 1024px): Filter sidebar đầy đủ, Table view hoặc 3 cột card

---

## VII. Luồng Hoạt Động Chính

### Search sản phẩm:
```
User gõ keyword → useDebounce(300ms) → TanStack Query
  → GET /api/v1/products/?q=...&page=1
  → Django SearchFilter (search trong 7 trường)
  → JSON PaginatedResponse<Product>
  → Render ProductTable / ProductGrid / EmptyState / Skeleton
```

### Tạo báo giá:
```
User tick chọn SP → Zustand store
User search + chọn KH → CustomerSearch autocomplete
Bấm "Tạo Báo Giá" → POST /api/v1/quotations/preview/
  → Django tạo HTML báo giá với:
     - Header TURBO DIESEL
     - Thông tin KH + phân loại → giá tương ứng
     - Bảng SP: Mã VT, Model, OEM, Đặc điểm, Đơn giá, Thành tiền
     - Tổng tiền + điều khoản + chữ ký
  → Frontend mở QuotationDialog preview
  → In / Xuất CSV
```

---

## VIII. Các Bước Triển Khai

| # | Bước | Chi tiết |
|---|------|----------|
| 1 | Tạo Django project | `django-admin startproject`, cài DRF + CORS + django-filter |
| 2 | Tạo models + migrate | Product, Customer |
| 3 | Tạo import command | `import_excel.py` — đọc Excel, import vào DB |
| 4 | Tạo API endpoints | Search/Filter sản phẩm, Customer search, Quotation preview |
| 5 | Seed data | Import file Excel BÁO GIÁ TURBO hoặc tạo 50 SP mẫu |
| 6 | Tạo Vite React TS project | `npm create vite@latest`, cài dependencies |
| 7 | Cấu hình Tailwind + ShadCN | `npx shadcn-ui@latest init`, add components |
| 8 | Cấu hình ESLint strict | `no-explicit-any: error`, `strict: true` |
| 9 | Tạo cấu trúc thư mục | Pages, components, hooks, store, types |
| 10 | Build SearchBar + FilterPanel | Thanh search + bộ lọc trái |
| 11 | Build ProductTable + ProductCard | Hiển thị sản phẩm (table + card) |
| 12 | Build CustomerSearch | Autocomplete khách hàng |
| 13 | Build ExportBar + QuotationDialog | Chọn SP + KH → tạo báo giá |
| 14 | Build EmptyState + Skeleton + Pagination | UI phụ trợ |
| 15 | Kết nối Frontend-Backend | TanStack Query hooks + test end-to-end |

---

## IX. Ghi Chú

- ✅ **Không làm auth/login** — chưa cần
- ✅ **Cấm `any`** trong TypeScript — dùng `unknown` nếu cần, nhưng ưu tiên type rõ ràng
- ✅ **Dùng TanStack Query** thay SWR
- ✅ **Dùng ShadCN UI** — tận dụng `Command` cho autocomplete, `Sheet` cho mobile filter
- ✅ **Giữ màu sắc TURBO DIESEL** — xanh dương chủ đạo, vàng/cam/xanh cho phân loại
- ✅ **Chức năng Báo giá** là core — preview HTML rồi in qua `window.print()`
- ✅ Backend có thể import trực tiếp từ file Excel gốc

---

## ✅ Duyệt kế hoạch

- Gõ **"OK"** hoặc **"Làm đi"** → Tôi bắt đầu code toàn bộ
- Gõ **"Sửa phần ..."** → Tôi cập nhật theo ý bạn
