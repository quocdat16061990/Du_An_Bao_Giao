# Phân Tích Dữ Liệu & Thiết Kế Database Quan Hệ — TURBO DIESEL

> **Ngày**: 2026-06-10
> **Nguồn**: BÁO_GIÁ_TURBO CLAUDE.xlsx (649 KB, 6 sheets)

---

## I. Kết Quả Phân Tích Excel

### Tổng quan 6 Sheet

| # | Sheet | Rows | Cols | Loại | Mô tả |
|---|-------|------|------|------|-------|
| 1 | DASHBOARD | 59 | A-M (13) | Derived | Thống kê tổng hợp: HÃNG MÁY, THƯƠNG HIỆU, số loại, tỷ lệ |
| 2 | TRA CỨU TỔNG HỢP | 51 | A-I (9) | Template | Gần như trống — chỉ là template/mockup cho search |
| 3 | 🚗 BÁO GIÁ TURBO | 690 | A-W (23) | **DATA** | **597 sản phẩm Turbo đầy đủ** |
| 4 | RUỘT TURBO | 892 | A-U (21) | **DATA** | **889 sản phẩm Ruột/Core turbo** |
| 5 | 📒 DANH SÁCH KH | 4,351 | A-J (10) | **DATA** | **4,349 khách hàng** |
| 6 | 🚌 NHÀ XE | 269 | A-F (6) | **LOOKUP** | **260 nhà xe** |

### Sheet 3: 🚗 BÁO GIÁ TURBO (597 products)

| Col | Field | Sample Values |
|-----|-------|---------------|
| A | HÃNG MÁY | CAT, CUMMINS, KOMATSU, HYUNDAI, HINO, ISUZU, MITSUBISHI... (54 unique) |
| B | MÃ VT | HH077147, HH081913, ... (unique per variant) |
| C | HÃNG SX | Mitsubishi, BorgWarner, IHI, Garrett, Holset (5 unique) |
| D | MODEL TURBO | Cat E320D/C6.4/TD06H |
| E | MÃ ĐỘNG CƠ | Engine model |
| F | OEM PART NO | 49179-02910, 8M06-100-E63 |
| G | ĐẶC ĐIỂM | Technical specs |
| H | ỨNG DỤNG | Application |
| I | GHI CHÚ | Notes |
| J | THƯƠNG HIỆU | JRONE, TBS, VIDARIR, FIRE, EE, MX, GARRETT, SL... (23 unique) |
| K | GIÁ VIP | Price (numeric) |
| L | GIÁ ƯU ĐÃI | Price |
| M | GIÁ ĐẠI LÝ | Price |
| N | GIÁ ĐL +10% | Price |
| O-P-Q | CG Ø DƯỚI / ĐỈNH / SỐ | Cánh gạt dimensions |
| R-S-T | CL Ø DƯỚI / ĐỈNH / SỐ | Cánh lớn dimensions |
| U-V-W | _BLOB / 0 | Metadata (likely ignored) |

**Key insight**: Có 90 dòng "category separator" (chứa emoji và text như "🏭 CAT · 34 loại turbo") — đây là header nhóm, không phải data.

### Sheet 4: RUỘT TURBO (889 products)

Cấu trúc tương tự BÁO GIÁ TURBO nhưng **không có cột ĐẶC ĐIỂM và ỨNG DỤNG**:

| Col | Field |
|-----|-------|
| A | HÃNG MÁY |
| B | MÃ VT |
| C | HÃNG SX |
| D | MODEL TURBO |
| E | MÃ ĐỘNG CƠ |
| F | OEM PART NO |
| G | GHI CHÚ |
| H | THƯƠNG HIỆU |
| I | GIÁ VIP |
| J | GIÁ ƯU ĐÃI |
| K | GIÁ ĐẠI LÝ |
| L | GIÁ ĐL +10% |
| M-N-O | CG Ø DƯỚI / ĐỈNH / SỐ |
| P-Q-R | CL Ø DƯỚI / ĐỈNH / SỐ |
| S-T-U | _BLOB / 0 |

### Sheet 5: 📒 DANH SÁCH KH (4,349 customers)

| Col | Field | Stats |
|-----|-------|-------|
| A | STT | 1 → 4349 |
| B | Mã KH | KH3751, KH3724... |
| C | Tên khách hàng | Tên + sometimes phone/address inline |
| D | Điện thoại | 3,906 có SĐT (90%), 443 không có |
| E | Phân loại | KHÁCH VIP (5), KHÁCH ƯU ĐÃI (1), VIP NGOẠI LỆ (2), còn lại trống |
| F | Địa chỉ | Mixed |
| G | Tỉnh/TP | 43 mã tỉnh (GLAI, KG, SG/HCM, HN...) |
| H | Ghi chú | Notes |
| I | Nhà xe | Rất ít dữ liệu (chỉ 1 record có) |
| J | _SK | Metadata |

### Sheet 6: 🚌 NHÀ XE (260 shipping companies)

| Col | Field |
|-----|-------|
| A | STT |
| B | TÊN CHÀNH / NHÀ XE |
| C | ĐIỆN THOẠI |
| D | ĐỊA CHỈ |
| E | GIỜ NHẬN |
| F | GHI CHÚ |

---

## II. Thiết Kế Database Quan Hệ

### ERD (Entity-Relationship Diagram)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   hang_may       │       │   hang_sx        │       │   thuong_hieu    │
│   (Machine Brand)│       │   (Manufacturer) │       │   (Turbo Brand)  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ ten (unique)     │       │ ten (unique)     │       │ ten (unique)     │
│ slug             │       │ slug             │       │ slug             │
│ icon             │       │ created_at       │       │ created_at       │
│ created_at       │       └──────┬───────────┘       └──────┬───────────┘
└──────┬───────────┘              │                          │
       │ 1                        │ 1                        │ 1
       │                          │                          │
       │ N                        │ N                        │ N
┌──────┴──────────────────────────┴──────────────────────────┴──────┐
│                          products                                  │
│                    (BÁO GIÁ TURBO + RUỘT TURBO)                    │
├────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                            │
│ hang_may_id (FK → hang_may)                                       │
│ hang_sx_id (FK → hang_sx, nullable)                               │
│ thuong_hieu_id (FK → thuong_hieu, nullable)                       │
│ loai (ENUM: 'turbo' | 'ruot')                                     │
│ ma_vt (unique per loai)                                            │
│ model_turbo                                                        │
│ ma_dong_co                                                         │
│ oem_part_no                                                        │
│ dac_diem               ← Chỉ có ở loai='turbo'                    │
│ ung_dung               ← Chỉ có ở loai='turbo'                    │
│ ghi_chu                                                            │
│ gia_vip (Decimal, nullable)                                        │
│ gia_uu_dai (Decimal, nullable)                                     │
│ gia_dai_ly (Decimal, nullable)                                     │
│ gia_dl_10 (Decimal, nullable)                                      │
│ cg_duoi (Decimal, nullable)                                        │
│ cg_dinh (Decimal, nullable)                                        │
│ cg_so (CharField, nullable)                                        │
│ cl_duoi (Decimal, nullable)                                        │
│ cl_dinh (Decimal, nullable)                                        │
│ cl_so (CharField, nullable)                                        │
│ sheet_name              ← 'BÁO GIÁ TURBO' hoặc 'RUỘT TURBO'       │
│ is_active (default=True)                                           │
│ created_at, updated_at                                             │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│              customers                   │
│           (DANH SÁCH KH)                 │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ ma_kh (unique)                          │
│ ten_kh                                  │
│ dien_thoai                              │
│ phan_loai (VIP | ƯU_ĐÃI | NGOẠI_LỆ     │
│            | CHƯA_PL)                   │
│ dia_chi                                 │
│ tinh_tp                                 │
│ ghi_chu                                 │
│ nha_xe_id (FK → nha_xe, nullable)      │
│ is_active (default=True)                │
│ created_at, updated_at                  │
└──────────────┬──────────────────────────┘
               │
               │ N:1 (nullable)
               │
┌──────────────┴──────────┐
│        nha_xe            │
│      (NHÀ XE)            │
├──────────────────────────┤
│ id (PK)                  │
│ ten_nha_xe               │
│ dien_thoai               │
│ dia_chi                  │
│ gio_nhan                 │
│ ghi_chu                  │
│ created_at               │
└──────────────────────────┘
```

### Bảng tổng hợp quan hệ:

| Bảng | Số records | Quan hệ |
|------|-----------|---------|
| `hang_may` | 54 | 1→N `products` |
| `hang_sx` | 5 | 1→N `products` |
| `thuong_hieu` | 23 | 1→N `products` |
| `products` | 1,486 (597+889) | N→1 `hang_may`, `hang_sx`, `thuong_hieu` |
| `customers` | 4,349 | N→1 `nha_xe` (nullable) |
| `nha_xe` | 260 | 1→N `customers` |

---

## III. Schema SQL (PostgreSQL — Supabase Compatible)

```sql
-- ============================================================
-- 1. Bảng danh mục: HÃNG MÁY (Machine Brands)
-- ============================================================
CREATE TABLE hang_may (
    id          SERIAL PRIMARY KEY,
    ten         VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Bảng danh mục: HÃNG SẢN XUẤT (Turbo Manufacturers)
-- ============================================================
CREATE TABLE hang_sx (
    id          SERIAL PRIMARY KEY,
    ten         VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Bảng danh mục: THƯƠNG HIỆU (Turbo Brands)
-- ============================================================
CREATE TABLE thuong_hieu (
    id          SERIAL PRIMARY KEY,
    ten         VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. Bảng sản phẩm (BÁO GIÁ + RUỘT)
-- ============================================================
CREATE TYPE product_loai AS ENUM ('turbo', 'ruot');

CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    hang_may_id     INTEGER NOT NULL REFERENCES hang_may(id),
    hang_sx_id      INTEGER REFERENCES hang_sx(id),
    thuong_hieu_id  INTEGER REFERENCES thuong_hieu(id),
    loai            product_loai NOT NULL DEFAULT 'turbo',

    -- Định danh
    ma_vt           VARCHAR(100) NOT NULL,
    model_turbo     VARCHAR(300) DEFAULT '',
    ma_dong_co      VARCHAR(300) DEFAULT '',
    oem_part_no     TEXT DEFAULT '',

    -- Chỉ có ở turbo
    dac_diem        TEXT DEFAULT '',
    ung_dung        TEXT DEFAULT '',

    -- Chung
    ghi_chu         TEXT DEFAULT '',

    -- Giá
    gia_vip         DECIMAL(12,0),
    gia_uu_dai      DECIMAL(12,0),
    gia_dai_ly      DECIMAL(12,0),
    gia_dl_10       DECIMAL(12,0),

    -- Kỹ thuật: CG = Cánh Gạt, CL = Cánh Lớn
    cg_duoi         DECIMAL(8,2),
    cg_dinh         DECIMAL(8,2),
    cg_so           VARCHAR(20) DEFAULT '',
    cl_duoi         DECIMAL(8,2),
    cl_dinh         DECIMAL(8,2),
    cl_so           VARCHAR(20) DEFAULT '',

    -- Metadata
    sheet_name      VARCHAR(50) DEFAULT '',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes cho search
CREATE INDEX idx_products_ma_vt ON products(ma_vt);
CREATE INDEX idx_products_model ON products(model_turbo);
CREATE INDEX idx_products_loai ON products(loai);
CREATE INDEX idx_products_hang_may ON products(hang_may_id);
CREATE INDEX idx_products_thuong_hieu ON products(thuong_hieu_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Full-text search index (PostgreSQL)
CREATE INDEX idx_products_search ON products
    USING GIN (to_tsvector('simple',
        coalesce(ma_vt,'') || ' ' ||
        coalesce(model_turbo,'') || ' ' ||
        coalesce(ma_dong_co,'') || ' ' ||
        coalesce(oem_part_no,'') || ' ' ||
        coalesce(dac_diem,'') || ' ' ||
        coalesce(ung_dung,'')
    ));

-- ============================================================
-- 5. Bảng khách hàng
-- ============================================================
CREATE TYPE phan_loai_kh AS ENUM ('VIP', 'ƯU_ĐÃI', 'NGOẠI_LỆ', 'CHƯA_PL');

CREATE TABLE customers (
    id              SERIAL PRIMARY KEY,
    ma_kh           VARCHAR(50) NOT NULL UNIQUE,
    ten_kh          VARCHAR(300) NOT NULL,
    dien_thoai      VARCHAR(20) DEFAULT '',
    phan_loai       phan_loai_kh DEFAULT 'CHƯA_PL',
    dia_chi         TEXT DEFAULT '',
    tinh_tp         VARCHAR(100) DEFAULT '',
    ghi_chu         TEXT DEFAULT '',
    nha_xe_id       INTEGER REFERENCES nha_xe(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_ten ON customers(ten_kh);
CREATE INDEX idx_customers_dt ON customers(dien_thoai);
CREATE INDEX idx_customers_phan_loai ON customers(phan_loai);
CREATE INDEX idx_customers_search ON customers
    USING GIN (to_tsvector('simple',
        coalesce(ten_kh,'') || ' ' ||
        coalesce(dien_thoai,'') || ' ' ||
        coalesce(dia_chi,'')
    ));

-- ============================================================
-- 6. Bảng nhà xe
-- ============================================================
CREATE TABLE nha_xe (
    id              SERIAL PRIMARY KEY,
    ten_nha_xe      VARCHAR(300) NOT NULL,
    dien_thoai      VARCHAR(20) DEFAULT '',
    dia_chi         TEXT DEFAULT '',
    gio_nhan        VARCHAR(100) DEFAULT '',
    ghi_chu         TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- View: Tổng hợp sản phẩm đầy đủ
-- ============================================================
CREATE VIEW v_products_full AS
SELECT
    p.id,
    p.loai,
    p.ma_vt,
    p.model_turbo,
    p.ma_dong_co,
    p.oem_part_no,
    p.dac_diem,
    p.ung_dung,
    p.ghi_chu,
    hm.ten AS hang_may,
    hs.ten AS hang_sx,
    th.ten AS thuong_hieu,
    p.gia_vip, p.gia_uu_dai, p.gia_dai_ly, p.gia_dl_10,
    COALESCE(p.gia_vip, p.gia_uu_dai, p.gia_dai_ly, p.gia_dl_10) AS gia_thap_nhat,
    p.cg_duoi, p.cg_dinh, p.cg_so,
    p.cl_duoi, p.cl_dinh, p.cl_so,
    p.sheet_name,
    p.is_active
FROM products p
LEFT JOIN hang_may hm ON p.hang_may_id = hm.id
LEFT JOIN hang_sx hs ON p.hang_sx_id = hs.id
LEFT JOIN thuong_hieu th ON p.thuong_hieu_id = th.id;
```

---

## IV. Kết Luận: Supabase Compatibility

###  CÓ — Database này hoàn toàn phù hợp với Supabase (PostgreSQL)

| Tiêu chí | Đánh giá |
|----------|----------|
| Relational (FK, JOIN) |   Đầy đủ quan hệ 1-N, N-1 |
| Enum types |  `product_loai`, `phan_loai_kh` |
| Full-text search |  GIN index + `to_tsvector` |
| Row Level Security |  Có thể thêm sau (khi có auth) |
| Supabase JS Client |  Tương thích hoàn toàn |
| Realtime |  Có thể subscribe changes |
| Backup/Restore |  pg_dump native |

### Bảng tổng kết dữ liệu:

| Bảng | Số dòng | Dung lượng ước tính |
|------|---------|---------------------|
| `hang_may` | 54 | ~5 KB |
| `hang_sx` | 5 | ~1 KB |
| `thuong_hieu` | 23 | ~3 KB |
| `products` | 1,486 | ~500 KB |
| `customers` | 4,349 | ~1 MB |
| `nha_xe` | 260 | ~30 KB |
| **TOTAL** | **~6,177** | **~1.5 MB** |

→ Database rất nhẹ, phù hợp cả Supabase **Free Tier** (500MB limit).

---

## V. Data Flow — Import Excel → Database

```
Excel File (.xlsx)
      │
      ▼
┌─────────────────────────────────────────┐
│  Python Import Script                    │
│  ─────────────────────────────────────  │
│  1. Mở file bằng zipfile + XML parse    │
│  2. Đọc từng sheet, detect type         │
│  3. Sheet 3 → products (loai='turbo')   │
│  4. Sheet 4 → products (loai='ruot')    │
│  5. Sheet 5 → customers                  │
│  6. Sheet 6 → nha_xe                     │
│  7. Trích xuất unique → hang_may,        │
│     hang_sx, thuong_hieu                 │
│  8. Map FK relationships                 │
│  9. Bulk INSERT vào PostgreSQL           │
└──────────────┬──────────────────────────┘
               │
               ▼
     PostgreSQL / Supabase
```

---

## VI. API Endpoints (Django REST)

Dựa trên database này, API endpoints:

```
# Products (search + filter)
GET  /api/v1/products/              # List + search + filter + paginate
GET  /api/v1/products/<id>/         # Detail
GET  /api/v1/products/stats/        # Thống kê

# Danh mục (cho filter dropdowns)
GET  /api/v1/hang-may/              # List machine brands
GET  /api/v1/hang-sx/               # List manufacturers
GET  /api/v1/thuong-hieu/           # List turbo brands

# Customers
GET  /api/v1/customers/             # List customers
GET  /api/v1/customers/search/      # Autocomplete search
GET  /api/v1/customers/<id>/        # Detail

# Nhà xe
GET  /api/v1/nha-xe/                # List shipping companies

# Quotation
POST /api/v1/quotations/preview/    # Generate quotation JSON
POST /api/v1/quotations/export-csv/ # Export CSV

# Import
POST /api/v1/import/excel/          # Upload & import Excel
```
