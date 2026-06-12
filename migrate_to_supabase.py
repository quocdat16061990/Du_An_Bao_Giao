#!/usr/bin/env python3
"""Migration: Tạo bảng + import dữ liệu Excel → Supabase PostgreSQL."""
import re, zipfile, sys, io
from decimal import Decimal, InvalidOperation
from xml.etree import ElementTree as ET
import psycopg2
from django.utils.text import slugify

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── Supabase Connection ──
DB_URL = 'postgresql://postgres.uobdphlbrvqurbfebcld:quocdat16061990@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'
EXCEL = r'c:\Users\QuocDat\.claude\skills\doc-file-excell\BÁO_GIÁ_TURBO CLAUDE.xlsx'

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
NS_REL = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}


def col_to_index(letters: str) -> int:
    idx = 0
    for ch in letters.upper():
        idx = idx * 26 + (ord(ch) - ord('A') + 1)
    return idx


def cell_text(cell):
    ct = cell.attrib.get('t', '')
    if ct == 'inlineStr':
        pieces = [n.text or '' for n in cell.findall('.//x:t', NS)]
        return ''.join(pieces)
    if ct == 'str':
        return cell.findtext('x:v', default='', namespaces=NS)
    return (cell.findtext('x:v', default='', namespaces=NS) or '').strip()


def parse_price(value: str):
    if not value or not value.strip():
        return None
    text = value.strip()
    if re.search(r'li[êe]n\s*h[ệe]', text, re.IGNORECASE):
        return None
    numbers = re.findall(r'[\d,.]+', text)
    if not numbers:
        return None
    raw = numbers[0]
    if '.' in raw and ',' in raw:
        raw = raw.replace('.', '').replace(',', '.')
    elif '.' in raw:
        parts = raw.split('.')
        if len(parts[-1]) == 3 and len(parts) > 1:
            raw = raw.replace('.', '')
    elif ',' in raw:
        parts = raw.split(',')
        if len(parts[-1]) == 3 and len(parts) > 1:
            raw = raw.replace(',', '')
        else:
            raw = raw.replace(',', '.')
    try:
        return Decimal(raw)
    except InvalidOperation:
        return None


def parse_decimal(value: str):
    if not value or not value.strip():
        return None
    try:
        return Decimal(value.strip().replace(',', '.'))
    except InvalidOperation:
        try:
            nums = re.findall(r'[\d.]+', value)
            return Decimal(nums[0]) if nums else None
        except (InvalidOperation, IndexError):
            return None


# ═══════════════════════════════════════════════════════════════
print('🔌 Connecting to Supabase...')
conn = psycopg2.connect(DB_URL, connect_timeout=15)
cur = conn.cursor()
print('✅ Connected!')

# ═══════════════════════════════════════════════════════════════
# 1. CREATE TABLES
# ═══════════════════════════════════════════════════════════════
print('\n📦 Creating tables...')

SQL_SCHEMA = """
-- Drop existing tables (clean start)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS nha_xe CASCADE;
DROP TABLE IF EXISTS hang_may CASCADE;
DROP TABLE IF EXISTS hang_sx CASCADE;
DROP TABLE IF EXISTS thuong_hieu CASCADE;
DROP TYPE IF EXISTS product_loai CASCADE;
DROP TYPE IF EXISTS phan_loai_kh CASCADE;
DROP VIEW IF EXISTS v_products_full;

-- Enum types
CREATE TYPE product_loai AS ENUM ('turbo', 'ruot');
CREATE TYPE phan_loai_kh AS ENUM ('VIP', 'ƯU_ĐÃI', 'NGOẠI_LỆ', 'CHƯA_PL');

-- 1. hang_may
CREATE TABLE hang_may (
    id          SERIAL PRIMARY KEY,
    ten         VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. hang_sx
CREATE TABLE hang_sx (
    id          SERIAL PRIMARY KEY,
    ten         VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. thuong_hieu
CREATE TABLE thuong_hieu (
    id          SERIAL PRIMARY KEY,
    ten         VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. nha_xe
CREATE TABLE nha_xe (
    id              SERIAL PRIMARY KEY,
    ten_nha_xe      VARCHAR(300) NOT NULL,
    dien_thoai      VARCHAR(20) DEFAULT '',
    dia_chi         TEXT DEFAULT '',
    gio_nhan        VARCHAR(100) DEFAULT '',
    ghi_chu         TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. products
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    hang_may_id     INTEGER NOT NULL REFERENCES hang_may(id),
    hang_sx_id      INTEGER REFERENCES hang_sx(id),
    thuong_hieu_id  INTEGER REFERENCES thuong_hieu(id),
    loai            product_loai NOT NULL DEFAULT 'turbo',
    ma_vt           VARCHAR(100) NOT NULL,
    model_turbo     VARCHAR(300) DEFAULT '',
    ma_dong_co      VARCHAR(300) DEFAULT '',
    oem_part_no     TEXT DEFAULT '',
    dac_diem        TEXT DEFAULT '',
    ung_dung        TEXT DEFAULT '',
    ghi_chu         TEXT DEFAULT '',
    gia_vip         DECIMAL(12,0),
    gia_uu_dai      DECIMAL(12,0),
    gia_dai_ly      DECIMAL(12,0),
    gia_dl_10       DECIMAL(12,0),
    cg_duoi         DECIMAL(8,2),
    cg_dinh         DECIMAL(8,2),
    cg_so           VARCHAR(20) DEFAULT '',
    cl_duoi         DECIMAL(8,2),
    cl_dinh         DECIMAL(8,2),
    cl_so           VARCHAR(20) DEFAULT '',
    sheet_name      VARCHAR(50) DEFAULT '',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. customers
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

-- Indexes
CREATE INDEX idx_products_ma_vt ON products(ma_vt);
CREATE INDEX idx_products_model ON products(model_turbo);
CREATE INDEX idx_products_loai ON products(loai);
CREATE INDEX idx_products_hang_may ON products(hang_may_id);
CREATE INDEX idx_products_thuong_hieu ON products(thuong_hieu_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_customers_ten ON customers(ten_kh);
CREATE INDEX idx_customers_dt ON customers(dien_thoai);
CREATE INDEX idx_customers_phan_loai ON customers(phan_loai);

-- Full-text search index
CREATE INDEX idx_products_search ON products
    USING GIN (to_tsvector('simple',
        coalesce(ma_vt,'') || ' ' ||
        coalesce(model_turbo,'') || ' ' ||
        coalesce(ma_dong_co,'') || ' ' ||
        coalesce(oem_part_no,'') || ' ' ||
        coalesce(dac_diem,'') || ' ' ||
        coalesce(ung_dung,'')
    ));

-- View
CREATE VIEW v_products_full AS
SELECT
    p.id, p.loai, p.ma_vt, p.model_turbo, p.ma_dong_co, p.oem_part_no,
    p.dac_diem, p.ung_dung, p.ghi_chu,
    hm.ten AS hang_may, hs.ten AS hang_sx, th.ten AS thuong_hieu,
    p.gia_vip, p.gia_uu_dai, p.gia_dai_ly, p.gia_dl_10,
    COALESCE(p.gia_vip, p.gia_uu_dai, p.gia_dai_ly, p.gia_dl_10) AS gia_thap_nhat,
    p.cg_duoi, p.cg_dinh, p.cg_so, p.cl_duoi, p.cl_dinh, p.cl_so,
    p.sheet_name, p.is_active
FROM products p
LEFT JOIN hang_may hm ON p.hang_may_id = hm.id
LEFT JOIN hang_sx hs ON p.hang_sx_id = hs.id
LEFT JOIN thuong_hieu th ON p.thuong_hieu_id = th.id;
"""

cur.execute(SQL_SCHEMA)
conn.commit()
print('✅ Tables created successfully!')

# Verify tables
cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
""")
tables = [r[0] for r in cur.fetchall()]
print(f'📋 Created tables: {tables}')

# ═══════════════════════════════════════════════════════════════
# 2. IMPORT FROM EXCEL
# ═══════════════════════════════════════════════════════════════
print('\n📖 Reading Excel file...')

hang_may_cache = {}
hang_sx_cache = {}
thuong_hieu_cache = {}
nha_xe_cache = {}

_slug_counter: dict[str, int] = {}

def _make_slug(name: str) -> str:
    s = slugify(name) or name.lower().replace(' ', '-').replace('/', '-')
    if s in _slug_counter:
        _slug_counter[s] += 1
        return f'{s}-{_slug_counter[s]}'
    _slug_counter[s] = 0
    return s

def get_or_create_hang_may(name):
    if name in hang_may_cache:
        return hang_may_cache[name]
    slug = _make_slug(name)
    try:
        cur.execute(
            "INSERT INTO hang_may (ten, slug) VALUES (%s, %s) ON CONFLICT (ten) DO NOTHING RETURNING id",
            (name, slug)
        )
        row = cur.fetchone()
        if row:
            _id = row[0]
            hang_may_cache[name] = _id
            return _id
    except Exception:
        conn.rollback()
        # Retry with different slug
        slug = _make_slug(name + '-2')
        cur.execute(
            "INSERT INTO hang_may (ten, slug) VALUES (%s, %s) ON CONFLICT (ten) DO NOTHING RETURNING id",
            (name, slug)
        )
        row = cur.fetchone()
        if row:
            _id = row[0]
            hang_may_cache[name] = _id
            return _id
    cur.execute("SELECT id FROM hang_may WHERE ten=%s", (name,))
    _id = cur.fetchone()[0]
    hang_may_cache[name] = _id
    return _id

def get_or_create_hang_sx(name):
    if name in hang_sx_cache:
        return hang_sx_cache[name]
    slug = _make_slug(name)
    try:
        cur.execute(
            "INSERT INTO hang_sx (ten, slug) VALUES (%s, %s) ON CONFLICT (ten) DO NOTHING RETURNING id",
            (name, slug)
        )
    except Exception:
        conn.rollback()
        slug = _make_slug(name + '-2')
        cur.execute(
            "INSERT INTO hang_sx (ten, slug) VALUES (%s, %s) ON CONFLICT (ten) DO NOTHING RETURNING id",
            (name, slug)
        )
    row = cur.fetchone()
    if row:
        _id = row[0]
        hang_sx_cache[name] = _id
        return _id
    cur.execute("SELECT id FROM hang_sx WHERE ten=%s", (name,))
    _id = cur.fetchone()[0]
    hang_sx_cache[name] = _id
    return _id

def get_or_create_thuong_hieu(name):
    if name in thuong_hieu_cache:
        return thuong_hieu_cache[name]
    slug = _make_slug(name)
    try:
        cur.execute(
            "INSERT INTO thuong_hieu (ten, slug) VALUES (%s, %s) ON CONFLICT (ten) DO NOTHING RETURNING id",
            (name, slug)
        )
    except Exception:
        conn.rollback()
        slug = _make_slug(name + '-2')
        cur.execute(
            "INSERT INTO thuong_hieu (ten, slug) VALUES (%s, %s) ON CONFLICT (ten) DO NOTHING RETURNING id",
            (name, slug)
        )
    row = cur.fetchone()
    if row:
        _id = row[0]
        thuong_hieu_cache[name] = _id
        return _id
    cur.execute("SELECT id FROM thuong_hieu WHERE ten=%s", (name,))
    _id = cur.fetchone()[0]
    thuong_hieu_cache[name] = _id
    return _id

def get_or_create_nha_xe(name):
    if name in nha_xe_cache:
        return nha_xe_cache[name]
    cur.execute(
        "INSERT INTO nha_xe (ten_nha_xe) VALUES (%s) ON CONFLICT DO NOTHING RETURNING id",
        (name,)
    )
    row = cur.fetchone()
    if row:
        _id = row[0]
        nha_xe_cache[name] = _id
        return _id
    # Nha_xe doesn't have unique constraint, so just select first
    cur.execute("SELECT id FROM nha_xe WHERE ten_nha_xe=%s LIMIT 1", (name,))
    row = cur.fetchone()
    if row:
        _id = row[0]
        nha_xe_cache[name] = _id
        return _id
    return None

with zipfile.ZipFile(EXCEL) as zf:
    wb = ET.fromstring(zf.read('xl/workbook.xml'))
    rels = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
    rel_targets = {}
    for rel in rels.findall('r:Relationship', NS_REL):
        tid = rel.attrib.get('Id', '')
        tgt = rel.attrib.get('Target', '').lstrip('/')
        if not tgt.startswith('xl/'):
            tgt = 'xl/' + tgt
        rel_targets[tid] = tgt

    sheets = []
    for sh in wb.findall('x:sheets/x:sheet', NS):
        rid = sh.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id', '')
        sheets.append((sh.attrib.get('name', '?'), rel_targets.get(rid, '')))

    p_count = 0

    # ── Process Sheet 3 (BÁO GIÁ TURBO) + Sheet 4 (RUỘT TURBO) ──
    for sheet_idx in [2, 3]:
        if sheet_idx >= len(sheets):
            continue
        sname, target = sheets[sheet_idx]
        loai = 'ruot' if 'RUỘT' in sname.upper() else 'turbo'
        print(f'\n  Processing: "{sname}" → loai={loai}')

        root = ET.fromstring(zf.read(target))
        rows = {}
        for row in root.findall('x:sheetData/x:row', NS):
            ri = int(row.attrib.get('r', '0') or 0)
            cells = {}
            for cell in row.findall('x:c', NS):
                ref = cell.attrib.get('r', '')
                if not ref:
                    continue
                m = re.fullmatch(r'([A-Z]+)([0-9]+)', ref.upper())
                if not m:
                    continue
                ci = col_to_index(m.group(1))
                cells[ci] = cell_text(cell)
            if cells:
                rows[ri] = cells

        header_row = 3
        data_rows = [(ri, r) for ri, r in sorted(rows.items()) if ri > header_row]

        batch = []
        for ri, r in data_rows:
            ma_vt = r.get(2, '').strip()
            if not ma_vt:
                continue
            hang_may_name = r.get(1, '').strip()
            if '🏭' in hang_may_name or 'loại' in hang_may_name:
                continue

            hang_sx_name = r.get(3, '').strip()
            model_turbo = r.get(4, '').strip()
            ma_dong_co = r.get(5, '').strip()
            oem_part_no = r.get(6, '').strip()

            if loai == 'turbo':
                dac_diem = r.get(7, '').strip()
                ung_dung = r.get(8, '').strip()
                ghi_chu = r.get(9, '').strip()
                thuong_hieu_name = r.get(10, '').strip()
                offset = 0
            else:
                dac_diem = ''
                ung_dung = ''
                ghi_chu = r.get(7, '').strip()
                thuong_hieu_name = r.get(8, '').strip()
                offset = -2

            hm_id = get_or_create_hang_may(hang_may_name)
            hs_id = get_or_create_hang_sx(hang_sx_name) if hang_sx_name else None
            th_id = get_or_create_thuong_hieu(thuong_hieu_name) if thuong_hieu_name else None

            gia_vip = parse_price(r.get(11 + offset, ''))
            gia_uu_dai = parse_price(r.get(12 + offset, ''))
            gia_dai_ly = parse_price(r.get(13 + offset, ''))
            gia_dl_10 = parse_price(r.get(14 + offset, ''))

            cg_duoi = parse_decimal(r.get(15 + offset, ''))
            cg_dinh = parse_decimal(r.get(16 + offset, ''))
            cg_so = r.get(17 + offset, '').strip()
            cl_duoi = parse_decimal(r.get(18 + offset, ''))
            cl_dinh = parse_decimal(r.get(19 + offset, ''))
            cl_so = r.get(20 + offset, '').strip()

            batch.append((
                hm_id, hs_id, th_id, loai, ma_vt, model_turbo, ma_dong_co,
                oem_part_no, dac_diem, ung_dung, ghi_chu,
                gia_vip, gia_uu_dai, gia_dai_ly, gia_dl_10,
                cg_duoi, cg_dinh, cg_so, cl_duoi, cl_dinh, cl_so, sname,
            ))

            if len(batch) >= 100:
                cur.executemany("""
                    INSERT INTO products
                    (hang_may_id, hang_sx_id, thuong_hieu_id, loai, ma_vt,
                     model_turbo, ma_dong_co, oem_part_no, dac_diem, ung_dung, ghi_chu,
                     gia_vip, gia_uu_dai, gia_dai_ly, gia_dl_10,
                     cg_duoi, cg_dinh, cg_so, cl_duoi, cl_dinh, cl_so, sheet_name)
                    VALUES (%s,%s,%s,%s,%s, %s,%s,%s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s,%s,%s,%s)
                """, batch)
                p_count += len(batch)
                print(f'    Imported {p_count} products...', end='\r')
                batch = []

        if batch:
            cur.executemany("""
                INSERT INTO products
                (hang_may_id, hang_sx_id, thuong_hieu_id, loai, ma_vt,
                 model_turbo, ma_dong_co, oem_part_no, dac_diem, ung_dung, ghi_chu,
                 gia_vip, gia_uu_dai, gia_dai_ly, gia_dl_10,
                 cg_duoi, cg_dinh, cg_so, cl_duoi, cl_dinh, cl_so, sheet_name)
                VALUES (%s,%s,%s,%s,%s, %s,%s,%s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s,%s,%s,%s)
            """, batch)
            p_count += len(batch)

    conn.commit()
    print(f'\n  ✅ Total products imported: {p_count}')

    # ── Process Sheet 5 (DANH SÁCH KH) ──
    if len(sheets) >= 5:
        sname, target = sheets[4]
        print(f'\n  Processing: "{sname}" (customers)')

        root = ET.fromstring(zf.read(target))
        rows = {}
        for row in root.findall('x:sheetData/x:row', NS):
            ri = int(row.attrib.get('r', '0') or 0)
            cells = {}
            for cell in row.findall('x:c', NS):
                ref = cell.attrib.get('r', '')
                if not ref:
                    continue
                m = re.fullmatch(r'([A-Z]+)([0-9]+)', ref.upper())
                if not m:
                    continue
                ci = col_to_index(m.group(1))
                cells[ci] = cell_text(cell)
            if cells:
                rows[ri] = cells

        header_row = 2
        data_rows = [(ri, r) for ri, r in sorted(rows.items()) if ri > header_row]

        pl_map = {'KHÁCH VIP': 'VIP', 'KHÁCH ƯU ĐÃI': 'ƯU_ĐÃI', 'VIP NGOẠI LỆ': 'NGOẠI_LỆ'}
        c_count = 0
        batch = []

        for ri, r in data_rows:
            ma_kh = r.get(2, '').strip()
            if not ma_kh:
                continue
            ten_kh = r.get(3, '').strip()
            dien_thoai = r.get(4, '').strip()
            phan_loai_raw = r.get(5, '').strip().upper()
            dia_chi = r.get(6, '').strip()
            tinh_tp = r.get(7, '').strip()
            ghi_chu = r.get(8, '').strip()
            nha_xe_name = r.get(9, '').strip()

            phan_loai = pl_map.get(phan_loai_raw, 'CHƯA_PL')
            nx_id = get_or_create_nha_xe(nha_xe_name) if nha_xe_name else None

            batch.append((
                ma_kh, ten_kh[:300], dien_thoai[:20], phan_loai,
                dia_chi[:500], tinh_tp[:100], ghi_chu[:500], nx_id
            ))

            if len(batch) >= 200:
                cur.executemany("""
                    INSERT INTO customers (ma_kh, ten_kh, dien_thoai, phan_loai, dia_chi, tinh_tp, ghi_chu, nha_xe_id)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (ma_kh) DO UPDATE SET ten_kh=EXCLUDED.ten_kh, dien_thoai=EXCLUDED.dien_thoai
                """, batch)
                c_count += len(batch)
                print(f'    Imported {c_count} customers...', end='\r')
                batch = []

        if batch:
            cur.executemany("""
                INSERT INTO customers (ma_kh, ten_kh, dien_thoai, phan_loai, dia_chi, tinh_tp, ghi_chu, nha_xe_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (ma_kh) DO UPDATE SET ten_kh=EXCLUDED.ten_kh, dien_thoai=EXCLUDED.dien_thoai
            """, batch)
            c_count += len(batch)

        conn.commit()
        print(f'\n  ✅ Total customers imported: {c_count}')

    # ── Process Sheet 6 (NHÀ XE) ──
    if len(sheets) >= 6:
        sname, target = sheets[5]
        print(f'\n  Processing: "{sname}" (nha_xe)')

        root = ET.fromstring(zf.read(target))
        rows = {}
        for row in root.findall('x:sheetData/x:row', NS):
            ri = int(row.attrib.get('r', '0') or 0)
            cells = {}
            for cell in row.findall('x:c', NS):
                ref = cell.attrib.get('r', '')
                if not ref:
                    continue
                m = re.fullmatch(r'([A-Z]+)([0-9]+)', ref.upper())
                if not m:
                    continue
                ci = col_to_index(m.group(1))
                cells[ci] = cell_text(cell)
            if cells:
                rows[ri] = cells

        header_row = 6
        data_rows = [(ri, r) for ri, r in sorted(rows.items()) if ri > header_row]

        nx_batch = []
        for ri, r in data_rows:
            ten = r.get(2, '').strip()  # Col B
            if not ten:
                continue
            dt = r.get(3, '').strip()
            dc = r.get(4, '').strip()
            gio = r.get(5, '').strip()
            gc = r.get(6, '').strip()
            nx_batch.append((ten, dt, dc, gio, gc))

        if nx_batch:
            cur.executemany("""
                INSERT INTO nha_xe (ten_nha_xe, dien_thoai, dia_chi, gio_nhan, ghi_chu)
                VALUES (%s,%s,%s,%s,%s)
            """, nx_batch)
            conn.commit()
            print(f'  ✅ Nhà xe imported: {len(nx_batch)}')

# ═══════════════════════════════════════════════════════════════
# 3. VERIFY
# ═══════════════════════════════════════════════════════════════
print('\n📊 Verifying data...')
cur.execute('SELECT COUNT(*) FROM hang_may')
print(f'  hang_may: {cur.fetchone()[0]} rows')
cur.execute('SELECT COUNT(*) FROM hang_sx')
print(f'  hang_sx: {cur.fetchone()[0]} rows')
cur.execute('SELECT COUNT(*) FROM thuong_hieu')
print(f'  thuong_hieu: {cur.fetchone()[0]} rows')
cur.execute('SELECT COUNT(*) FROM products')
print(f'  products: {cur.fetchone()[0]} rows')
cur.execute('SELECT COUNT(*) FROM customers')
print(f'  customers: {cur.fetchone()[0]} rows')
cur.execute('SELECT COUNT(*) FROM nha_xe')
print(f'  nha_xe: {cur.fetchone()[0]} rows')

cur.execute("SELECT loai, COUNT(*) FROM products GROUP BY loai")
for row in cur.fetchall():
    print(f'    → {row[0]}: {row[1]}')

# Sample data
print('\n📝 Sample products:')
cur.execute("""
    SELECT p.ma_vt, p.model_turbo, hm.ten, th.ten, p.gia_vip
    FROM products p
    LEFT JOIN hang_may hm ON p.hang_may_id=hm.id
    LEFT JOIN thuong_hieu th ON p.thuong_hieu_id=th.id
    WHERE p.gia_vip IS NOT NULL
    LIMIT 5
""")
for row in cur.fetchall():
    print(f'  {row}')

cur.close()
conn.close()

print('\n🎉 Migration to Supabase COMPLETE!')
