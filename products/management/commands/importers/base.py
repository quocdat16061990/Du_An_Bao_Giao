"""Base importer — dùng chung cho mọi file Excel/Word."""
import re
import zipfile
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET

from django.utils.text import slugify

from products.models import Category, HangMay, HangSx, ThuongHieu, Product, ImportLog

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
NS_REL = {
    'r': 'http://schemas.openxmlformats.org/package/2006/relationships',
    'office': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


@dataclass
class ImportResult:
    file_name: str = ''
    status: str = 'SUCCESS'
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list = field(default_factory=list)


def col_to_index(letters: str) -> int:
    """Chuyển ký tự cột Excel (A, B, ..., AA, AB...) sang index 1-based."""
    idx = 0
    for ch in letters.upper():
        idx = idx * 26 + (ord(ch) - ord('A') + 1)
    return idx


def cell_text(cell) -> str:
    """Trích xuất text từ cell XML Excel."""
    ct = cell.attrib.get('t', '')
    if ct == 'inlineStr':
        pieces = [n.text or '' for n in cell.findall('.//x:t', NS)]
        return ''.join(pieces)
    if ct == 'str':
        return cell.findtext('x:v', default='', namespaces=NS)
    return (cell.findtext('x:v', default='', namespaces=NS) or '').strip()


def parse_price(value: str) -> Optional[Decimal]:
    """Parse giá tiền từ text — VD: '1.250.000' -> Decimal('1250000')."""
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


def parse_decimal(value: str) -> Optional[Decimal]:
    """Parse số thập phân — VD: '48.4' -> Decimal('48.4')."""
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


class BaseExcelImporter(ABC):
    """Base class cho tất cả Excel importer."""

    file_pattern: str = '*.xlsx'  # Pattern để match file
    importer_name: str = 'base'
    batch_size: int = 1000  # Số record mỗi batch

    def __init__(self, dry_run: bool = False, overwrite_prices: bool = False, batch_size: int = 1000):
        self.dry_run = dry_run
        self.overwrite_prices = overwrite_prices
        self.batch_size = batch_size
        self.result = ImportResult()
        self._category_cache = {}
        self._hang_may_cache = {}
        self._hang_sx_cache = {}
        self._thuong_hieu_cache = {}
        # Batch accumulator
        self._batch: list = []

    # ── Cache helpers ──

    def get_category(self, slug: str, ten: str = '', mo_ta: str = '', order: int = 0) -> Optional[Category]:
        """Lấy hoặc tạo Category từ cache (dùng slug làm key)."""
        if slug in self._category_cache:
            return self._category_cache[slug]
        cat = Category.objects.filter(slug=slug).first()
        if not cat:
            cat = Category.objects.create(slug=slug, ten=ten or slug, mo_ta=mo_ta, order=order)
        self._category_cache[slug] = cat
        return cat

    def get_hang_may(self, ten: str) -> HangMay:
        """Lấy hoặc tạo HangMay (dùng slug để tránh trùng case-insensitive)."""
        ten = ten.strip()
        if not ten:
            ten = 'CHƯA RÕ'
        if ten in self._hang_may_cache:
            return self._hang_may_cache[ten]
        s = slugify(ten)
        hm = HangMay.objects.filter(slug=s).first()
        if not hm:
            hm = HangMay.objects.create(ten=ten, slug=s)
        self._hang_may_cache[ten] = hm
        return hm

    def get_hang_sx(self, ten: str) -> Optional[HangSx]:
        """Lấy hoặc tạo HangSx (dùng slug để tránh trùng case-insensitive)."""
        ten = ten.strip()
        if not ten:
            return None
        if ten in self._hang_sx_cache:
            return self._hang_sx_cache[ten]
        s = slugify(ten)
        hs = HangSx.objects.filter(slug=s).first()
        if not hs:
            hs = HangSx.objects.create(ten=ten, slug=s)
        self._hang_sx_cache[ten] = hs
        return hs

    def get_thuong_hieu(self, ten: str) -> Optional[ThuongHieu]:
        """Lấy hoặc tạo ThuongHieu (dùng slug để tránh trùng case-insensitive)."""
        ten = ten.strip()
        if not ten:
            return None
        if ten in self._thuong_hieu_cache:
            return self._thuong_hieu_cache[ten]
        s = slugify(ten)
        th = ThuongHieu.objects.filter(slug=s).first()
        if not th:
            th = ThuongHieu.objects.create(ten=ten, slug=s)
        self._thuong_hieu_cache[ten] = th
        return th

    # ── Core import logic ──

    def open_excel(self, file_path: Path) -> tuple:
        """Mở file Excel, trả về (zipfile, list_of_sheets)."""
        zf = zipfile.ZipFile(file_path)
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
            rid = sh.attrib.get(
                '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id', ''
            )
            sheets.append((sh.attrib.get('name', '?'), rel_targets.get(rid, '')))
        return zf, sheets

    def parse_rows(self, zf, target: str) -> dict:
        """Parse tất cả rows từ 1 sheet thành dict {row_number: {col_index: text}}."""
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
        return rows

    # ── Batch processing ──

    def add_to_batch(self, ma_vt: str, loai: str, defaults: dict):
        """Thêm 1 record vào batch. Khi đủ batch_size thì flush."""
        self._batch.append((ma_vt, loai, defaults))
        if len(self._batch) >= self.batch_size:
            self.flush_batch()

    def flush_batch(self):
        """Ghi batch hiện tại vào DB bằng bulk UPSERT."""
        if not self._batch:
            return
        if self.dry_run:
            self.result.created += len(self._batch)
            self._batch.clear()
            return

        batch = self._batch
        self._batch = []

        # Lấy tất cả ma_vt + loai trong batch
        keys = [(ma_vt, loai) for ma_vt, loai, _ in batch]

        # Query existing products trong 1 query
        from django.db.models import Q
        q_filter = Q()
        for ma_vt, loai in keys:
            q_filter |= Q(ma_vt=ma_vt, loai=loai)

        existing_map = {}
        for p in Product.objects.filter(q_filter).only('id', 'ma_vt', 'loai',
                                                         'gia_von', 'gia_vip', 'gia_uu_dai',
                                                         'gia_dai_ly', 'gia_gara', 'gia_dl_10'):
            existing_map[(p.ma_vt, p.loai)] = p

        to_create = []
        to_update = []
        now = None  # Django auto_now handles this

        for ma_vt, loai, defaults in batch:
            key = (ma_vt, loai)
            if key in existing_map:
                existing = existing_map[key]
                # Nếu không overwrite prices, giữ giá cũ
                if not self.overwrite_prices:
                    price_fields = ['gia_von', 'gia_vip', 'gia_uu_dai', 'gia_dai_ly', 'gia_gara', 'gia_dl_10']
                    for pf in price_fields:
                        if defaults.get(pf) is not None and getattr(existing, pf) is not None:
                            defaults[pf] = getattr(existing, pf)
                        elif pf in defaults and defaults[pf] is None:
                            defaults[pf] = getattr(existing, pf)

                # Update existing (set id để Django biết đây là update)
                obj = Product(id=existing.id, ma_vt=ma_vt, loai=loai, **defaults)
                to_update.append(obj)
            else:
                to_create.append(Product(ma_vt=ma_vt, loai=loai, **defaults))

        # Create từng cái (không dùng bulk_create vì ENUM product_loai)
        # Số lượng create thường rất ít sau lần import đầu tiên
        for obj in to_create:
            obj.save()
        self.result.created += len(to_create)

        # Bulk update (không đụng loai nên ko bị lỗi ENUM)
        if to_update:
            update_fields = [
                'category', 'hang_may', 'hang_sx', 'thuong_hieu',
                'ten_hang', 'dvt', 'doi_th_sx', 'parno',
                'model_turbo', 'ma_dong_co', 'oem_part_no',
                'dac_diem', 'ung_dung', 'ghi_chu', 'hinh_anh',
                'gia_von', 'gia_vip', 'gia_uu_dai', 'gia_dai_ly', 'gia_gara', 'gia_dl_10',
                'cg_duoi', 'cg_dinh', 'cg_so', 'cl_duoi', 'cl_dinh', 'cl_so',
                'attributes', 'sheet_name', 'is_active',
            ]
            Product.objects.bulk_update(to_update, update_fields, batch_size=self.batch_size)
            self.result.updated += len(to_update)

        self.log(f'Batch flushed: {len(to_create)} created, {len(to_update)} updated')

    @abstractmethod
    def import_file(self, file_path: Path) -> ImportResult:
        """Import 1 file — implement trong subclass."""
        ...

    def log(self, msg: str):
        """In ra stdout (dùng trong management command)."""
        try:
            print(f"  [{self.importer_name}] {msg}")
        except UnicodeEncodeError:
            safe_msg = msg.encode('ascii', errors='replace').decode('ascii')
            print(f"  [{self.importer_name}] {safe_msg}")
