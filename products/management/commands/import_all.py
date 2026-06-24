"""Import tat ca file Excel trong docs/ + KH + Nha xe."""
import sys
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from products.models import ImportLog
from .importers.turbo_v13_gia import TurboV13GiaImporter
from .importers.turbo_claude import TurboClaudeImporter
from .importers.bo_hoi_moi import BoHoiMoiImporter
from .importers.tong_hop_phu_tung import TongHopPhuTungImporter

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


class Command(BaseCommand):
    help = 'Import all: Products + Customers + NhaXe from docs/'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Preview only')
        parser.add_argument('--docs-dir', type=str, default='', help='Path to docs/')
        parser.add_argument('--overwrite-prices', action='store_true', help='Overwrite existing prices')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        overwrite = options['overwrite_prices']

        docs_dir = Path(options['docs_dir']) if options['docs_dir'] else Path(settings.BASE_DIR) / 'docs'
        if not docs_dir.exists():
            self.stderr.write(f'Docs dir not found: {docs_dir}')
            return

        self.stdout.write(f'Docs dir: {docs_dir}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE'))

        # ── Step 1: Import San pham ──
        # Thu tu: File co gia truoc, file khong gia sau de khong overwrite gia tot
        product_importers = [
            ('Turbo v13 CO GIA (uu tien)', TurboV13GiaImporter(dry_run=dry_run, overwrite_prices=True, batch_size=500)),
            ('Phu tung Bo Hoi Moi', BoHoiMoiImporter(dry_run=dry_run, overwrite_prices=False, batch_size=500)),
            ('Tong hop phu tung (bo sung)', TongHopPhuTungImporter(dry_run=dry_run, overwrite_prices=False, batch_size=500)),
        ]

        total_created = 0
        total_updated = 0

        for label, importer in product_importers:
            self.stdout.write(f'\n{"="*60}')
            self.stdout.write(f'  [{label}]')
            self.stdout.write(f'  Pattern: {importer.file_pattern}')
            self.stdout.write(f'{"="*60}')

            matched = sorted(docs_dir.glob(importer.file_pattern))
            if not matched:
                self.stdout.write(f'  -> No files matching pattern')
                continue

            for fp in matched:
                if fp.name.startswith('~$'):
                    continue
                self.stdout.write(f'  File: {fp.name}')
                result = importer.import_file(fp)

                if result:
                    total_created += result.created
                    total_updated += result.updated

                    if not dry_run:
                        ImportLog.objects.create(
                            file_name=result.file_name,
                            status=result.status,
                            products_created=result.created,
                            products_updated=result.updated,
                            errors=result.errors,
                        )

                    self.stdout.write(
                        f'    -> Created: {result.created} | Updated: {result.updated} | '
                        f'Skipped: {result.skipped} | Errors: {len(result.errors)}'
                    )
                    if result.errors:
                        for err in result.errors[:5]:
                            self.stdout.write(f'       ERR: {err}')

        self.stdout.write(self.style.SUCCESS(
            f'\n{"="*60}\n'
            f'  PRODUCT IMPORT COMPLETE\n'
            f'  Created: {total_created} | Updated: {total_updated}\n'
            f'{"="*60}'
        ))

        # ── Step 2: Import Khach hang + Nha xe tu File 2 ──
        kh_files = sorted(docs_dir.glob('BAO_GIA_TURBO_v13_GIA_CO_ANH.xlsx'))
        if kh_files:
            self.stdout.write(f'\n{"="*60}')
            self.stdout.write(f'  Importing CUSTOMERS + NHA XE...')
            self.stdout.write(f'{"="*60}')
            self._import_customers_and_nhaxe(kh_files[0], dry_run)

    def _import_customers_and_nhaxe(self, file_path: Path, dry_run: bool):
        """Import KH + Nha xe tu File 2 (BAO_GIA_TURBO_v13_GIA_CO_ANH.xlsx)."""
        import re, zipfile
        from xml.etree import ElementTree as ET
        from products.models import Customer, NhaXe

        NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        NS_REL = {
            'r': 'http://schemas.openxmlformats.org/package/2006/relationships',
            'office': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        }

        def col_to_index(letters):
            idx = 0
            for ch in letters.upper():
                idx = idx * 26 + (ord(ch) - ord('A') + 1)
            return idx

        def cell_text(cell):
            ct = cell.attrib.get('t', '')
            if ct == 'inlineStr':
                return ''.join(n.text or '' for n in cell.findall('.//x:t', NS))
            if ct == 'str':
                return cell.findtext('x:v', default='', namespaces=NS)
            return (cell.findtext('x:v', default='', namespaces=NS) or '').strip()

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
            rid = sh.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id', '')
            sheets.append((sh.attrib.get('name', '?'), rel_targets.get(rid, '')))

        # ── Import NHA XE (sheet 7) ──
        nx_created = 0
        for sname, target in sheets:
            if 'NHÀ XE' in sname.upper() or 'NHA XE' in sname.upper():
                self.stdout.write(f'  Processing NHA XE: "{sname}"')
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
                        cells[col_to_index(m.group(1))] = cell_text(cell)
                    if cells:
                        rows[ri] = cells

                for ri in sorted(rows):
                    if ri <= 6:  # Skip header
                        continue
                    r = rows[ri]
                    ten = r.get(1, '').strip() or r.get(2, '').strip()
                    if not ten or 'STT' in ten or 'CHÀNH' in ten:
                        continue
                    dt = r.get(3, '').strip()
                    dia_chi = r.get(4, '').strip()
                    gio_nhan = r.get(5, '').strip()
                    ghi_chu = r.get(6, '').strip()

                    nx, created = NhaXe.objects.get_or_create(
                        ten_nha_xe=ten[:300],
                        defaults={'dien_thoai': dt, 'dia_chi': dia_chi, 'gio_nhan': gio_nhan, 'ghi_chu': ghi_chu}
                    )
                    if created:
                        nx_created += 1

                self.stdout.write(f'    NhaXe created: {nx_created}')
                break

        # ── Import KHACH HANG (sheet 6) ──
        for sname, target in sheets:
            if 'KH' in sname.upper() and 'DANH' in sname.upper():
                self.stdout.write(f'  Processing KHACH HANG: "{sname}"')
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
                        cells[col_to_index(m.group(1))] = cell_text(cell)
                    if cells:
                        rows[ri] = cells

                c_created = 0
                c_updated = 0
                c_skip = 0

                for ri in sorted(rows):
                    if ri <= 2:
                        continue
                    r = rows[ri]

                    # Col B=2: Ma KH, Col C=3: Ten KH, Col D=4: DT, Col E=5: Phan loai
                    # Col F=6: Dia chi, Col G=7: Tinh/TP, Col H=8: Ghi chu, Col I=9: Nha xe
                    ma_kh = r.get(2, '').strip()
                    ten_kh = r.get(3, '').strip()
                    dien_thoai = r.get(4, '').strip()
                    phan_loai_raw = r.get(5, '').strip().upper()
                    dia_chi = r.get(6, '').strip()
                    tinh_tp = r.get(7, '').strip()
                    ghi_chu = r.get(8, '').strip()
                    nha_xe_name = r.get(9, '').strip()

                    if not ma_kh:
                        c_skip += 1
                        continue

                    # Map phan loai
                    phan_loai = 'CHƯA_PL'
                    if 'VIP' in phan_loai_raw:
                        if 'NGOẠI' in phan_loai_raw or 'LỆ' in phan_loai_raw:
                            phan_loai = 'NGOẠI_LỆ'
                        else:
                            phan_loai = 'VIP'
                    elif 'ƯU' in phan_loai_raw or 'UU' in phan_loai_raw:
                        phan_loai = 'ƯU_ĐÃI'

                    # Tim nha_xe_id
                    nha_xe_obj = None
                    if nha_xe_name:
                        nha_xe_obj = NhaXe.objects.filter(ten_nha_xe__icontains=nha_xe_name[:100]).first()

                    _, created = Customer.objects.update_or_create(
                        ma_kh=ma_kh,
                        defaults={
                            'ten_kh': ten_kh[:300],
                            'dien_thoai': dien_thoai[:20],
                            'phan_loai': phan_loai,
                            'dia_chi': dia_chi,
                            'tinh_tp': tinh_tp[:100],
                            'ghi_chu': ghi_chu,
                            'nha_xe': nha_xe_obj,
                        }
                    )
                    if created:
                        c_created += 1
                    else:
                        c_updated += 1

                self.stdout.write(f'    KH Created: {c_created} | Updated: {c_updated} | Skipped: {c_skip}')
                break

        zf.close()
