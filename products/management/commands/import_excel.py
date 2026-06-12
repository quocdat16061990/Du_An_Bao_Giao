"""Import dữ liệu từ file Excel BÁO GIÁ TURBO vào database."""
import re
import zipfile
from decimal import Decimal, InvalidOperation
from pathlib import Path
from xml.etree import ElementTree as ET

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from products.models import HangMay, HangSx, ThuongHieu, NhaXe, Product, Customer, ImportLog

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
NS_REL = {
    'r': 'http://schemas.openxmlformats.org/package/2006/relationships',
    'office': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

EXCEL_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent.parent.parent
EXCEL_PATH = EXCEL_PATH / 'doc-file-excell' / 'BÁO_GIÁ_TURBO CLAUDE.xlsx'


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


def parse_price(value: str) -> Decimal | None:
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


def parse_decimal(value: str) -> Decimal | None:
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


class Command(BaseCommand):
    help = 'Import data from Excel file into database'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default=str(EXCEL_PATH), help='Path to Excel file')

    def handle(self, *args, **options):
        file_path = Path(options['file'])
        if not file_path.exists():
            self.stderr.write(f'File not found: {file_path}')
            return

        log = ImportLog.objects.create(file_name=file_path.name, status='PARTIAL')
        errors = []
        p_created = p_updated = c_created = c_updated = 0

        try:
            with zipfile.ZipFile(file_path) as zf:
                # Get sheet list
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

                self.stdout.write(f'Found {len(sheets)} sheets')

                # Process sheets 3 (BÁO GIÁ TURBO) and 4 (RUỘT TURBO) for products
                for sheet_idx in [2, 3]:  # 0-indexed: sheet 3 and 4
                    if sheet_idx >= len(sheets):
                        continue
                    sname, target = sheets[sheet_idx]
                    loai = 'ruot' if 'RUỘT' in sname.upper() else 'turbo'
                    self.stdout.write(f'\nProcessing Sheet: "{sname}" → loai={loai}')

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

                    # Header is row 3
                    header_row = 3
                    data_rows = [(ri, r) for ri, r in sorted(rows.items()) if ri > header_row]

                    for ri, r in data_rows:
                        ma_vt = r.get(2, '').strip()  # Col B
                        if not ma_vt:
                            continue  # Skip category separators

                        hang_may_name = r.get(1, '').strip()  # Col A
                        if '🏭' in hang_may_name or 'loại' in hang_may_name:
                            continue  # Skip category header rows

                        hang_sx_name = r.get(3, '').strip()  # Col C
                        model_turbo = r.get(4, '').strip()  # Col D
                        ma_dong_co = r.get(5, '').strip()  # Col E
                        oem_part_no = r.get(6, '').strip()  # Col F

                        if loai == 'turbo':
                            dac_diem = r.get(7, '').strip()  # Col G
                            ung_dung = r.get(8, '').strip()  # Col H
                            ghi_chu = r.get(9, '').strip()  # Col I
                            thuong_hieu_name = r.get(10, '').strip()  # Col J
                            col_offset = 0
                        else:
                            dac_diem = ''
                            ung_dung = ''
                            ghi_chu = r.get(7, '').strip()  # Col G
                            thuong_hieu_name = r.get(8, '').strip()  # Col H
                            col_offset = -2  # Ruột has 2 fewer columns

                        # Get or create FK objects
                        hm, _ = HangMay.objects.get_or_create(
                            ten=hang_may_name, defaults={'slug': slugify(hang_may_name)}
                        )
                        hs = None
                        if hang_sx_name:
                            hs, _ = HangSx.objects.get_or_create(
                                ten=hang_sx_name, defaults={'slug': slugify(hang_sx_name)}
                            )
                        th = None
                        if thuong_hieu_name:
                            th, _ = ThuongHieu.objects.get_or_create(
                                ten=thuong_hieu_name, defaults={'slug': slugify(thuong_hieu_name)}
                            )

                        # Prices (columns K-N or I-L depending on loai)
                        price_col_k = 11 + col_offset
                        price_col_l = 12 + col_offset
                        price_col_m = 13 + col_offset
                        price_col_n = 14 + col_offset

                        gia_vip = parse_price(r.get(price_col_k, ''))
                        gia_uu_dai = parse_price(r.get(price_col_l, ''))
                        gia_dai_ly = parse_price(r.get(price_col_m, ''))
                        gia_dl_10 = parse_price(r.get(price_col_n, ''))

                        # Technical specs
                        cg_duoi = parse_decimal(r.get(15 + col_offset, ''))
                        cg_dinh = parse_decimal(r.get(16 + col_offset, ''))
                        cg_so = r.get(17 + col_offset, '').strip()
                        cl_duoi = parse_decimal(r.get(18 + col_offset, ''))
                        cl_dinh = parse_decimal(r.get(19 + col_offset, ''))
                        cl_so = r.get(20 + col_offset, '').strip()

                        # Create or update product
                        product, created = Product.objects.update_or_create(
                            ma_vt=ma_vt, loai=loai,
                            defaults={
                                'hang_may': hm, 'hang_sx': hs, 'thuong_hieu': th,
                                'model_turbo': model_turbo, 'ma_dong_co': ma_dong_co,
                                'oem_part_no': oem_part_no, 'dac_diem': dac_diem,
                                'ung_dung': ung_dung, 'ghi_chu': ghi_chu,
                                'gia_vip': gia_vip, 'gia_uu_dai': gia_uu_dai,
                                'gia_dai_ly': gia_dai_ly, 'gia_dl_10': gia_dl_10,
                                'cg_duoi': cg_duoi, 'cg_dinh': cg_dinh, 'cg_so': cg_so,
                                'cl_duoi': cl_duoi, 'cl_dinh': cl_dinh, 'cl_so': cl_so,
                                'sheet_name': sname,
                            }
                        )
                        if created:
                            p_created += 1
                        else:
                            p_updated += 1

                    self.stdout.write(f'  Products: {p_created} created, {p_updated} updated')

                # Sheet 5: DANH SÁCH KH (customers)
                if len(sheets) >= 5:
                    sname, target = sheets[4]
                    self.stdout.write(f'\nProcessing Sheet: "{sname}" (customers)')

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

                    for ri, r in data_rows:
                        ma_kh = r.get(2, '').strip()  # Col B
                        if not ma_kh:
                            continue

                        ten_kh = r.get(3, '').strip()  # Col C
                        dien_thoai = r.get(4, '').strip()  # Col D
                        phan_loai_raw = r.get(5, '').strip()  # Col E
                        dia_chi = r.get(6, '').strip()  # Col F
                        tinh_tp = r.get(7, '').strip()  # Col G
                        ghi_chu = r.get(8, '').strip()  # Col H
                        nha_xe_name = r.get(9, '').strip()  # Col I

                        # Map phân loại
                        pl_map = {
                            'KHÁCH VIP': 'VIP', 'KHÁCH ƯU ĐÃI': 'ƯU_ĐÃI',
                            'VIP NGOẠI LỆ': 'NGOẠI_LỆ',
                        }
                        phan_loai = pl_map.get(phan_loai_raw.upper(), 'CHƯA_PL')

                        # Nha xe FK
                        nx = None
                        if nha_xe_name:
                            nx, _ = NhaXe.objects.get_or_create(ten_nha_xe=nha_xe_name)

                        customer, created = Customer.objects.update_or_create(
                            ma_kh=ma_kh,
                            defaults={
                                'ten_kh': ten_kh, 'dien_thoai': dien_thoai,
                                'phan_loai': phan_loai, 'dia_chi': dia_chi,
                                'tinh_tp': tinh_tp, 'ghi_chu': ghi_chu,
                                'nha_xe': nx,
                            }
                        )
                        if created:
                            c_created += 1
                        else:
                            c_updated += 1

                    self.stdout.write(f'  Customers: {c_created} created, {c_updated} updated')

            log.status = 'SUCCESS' if not errors else 'PARTIAL'

        except Exception as e:
            errors.append(str(e))
            log.status = 'FAILED'
            self.stderr.write(f'ERROR: {e}')

        log.products_created = p_created
        log.products_updated = p_updated
        log.customers_created = c_created
        log.customers_updated = c_updated
        log.errors = errors
        log.save()

        self.stdout.write(self.style.SUCCESS(
            f'\nImport complete!\n'
            f'  Products: {p_created} new, {p_updated} updated\n'
            f'  Customers: {c_created} new, {c_updated} updated\n'
            f'  Status: {log.status}'
        ))
