"""Import chỉ khách hàng từ Sheet DANH SÁCH KH của file Excel — có progress bar."""
import re
import zipfile
import time
from pathlib import Path
from xml.etree import ElementTree as ET

from django.core.management.base import BaseCommand
from products.models import Customer, NhaXe

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
NS_REL = {
    'r': 'http://schemas.openxmlformats.org/package/2006/relationships',
    'office': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


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


class Command(BaseCommand):
    help = 'Import chỉ khách hàng từ Sheet DANH SÁCH KH của file Excel'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, required=True, help='Path to Excel file')

    def handle(self, *args, **options):
        file_path = Path(options['file'])
        if not file_path.exists():
            self.stderr.write(f'File not found: {file_path}')
            return

        self.stdout.write(f'📂 Reading: {file_path.name}')

        try:
            with zipfile.ZipFile(file_path) as zf:
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

                self.stdout.write(f'📋 {len(sheets)} sheets')

                # Tìm sheet "DANH SÁCH KH"
                kh_sheet = None
                for i, (name, target) in enumerate(sheets):
                    if 'KH' in name.upper() and 'DANH' in name.upper():
                        kh_sheet = (name, target)
                        break

                if not kh_sheet:
                    if len(sheets) >= 7:
                        kh_sheet = sheets[6]  # Sheet 7
                        self.stdout.write(f'⚠️  Fallback sheet 7: "{kh_sheet[0]}"')
                    else:
                        self.stderr.write('❌ Không tìm thấy sheet DANH SÁCH KH!')
                        return

                sname, target = kh_sheet
                self.stdout.write(f'📄 Sheet: "{sname}"')

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

                sorted_rows = sorted(rows.items())
                if not sorted_rows:
                    self.stderr.write('❌ Sheet trống!')
                    return

                # Skip row 1 (có thể là header hoặc trống)
                # Header thực sự thường ở row 2
                header_row = 1
                data_rows = [(ri, r) for ri, r in sorted_rows if ri > header_row]

                total = len(data_rows)
                self.stdout.write(f'👥 {total} dòng dữ liệu, đang import...')

                # Pre-load tất cả NhaXe vào cache để giảm query
                nha_xe_cache = {nx.ten_nha_xe: nx for nx in NhaXe.objects.all()}

                c_created = 0
                c_updated = 0
                c_skipped = 0
                t0 = time.time()
                last_print = 0

                for idx, (ri, r) in enumerate(data_rows):
                    # ── Parse từ Col10 (pipe-delimited): MA_KH|TEN_KH|DIEN_THOAI|... ──
                    raw_col10 = r.get(10, '').strip()  # Col J
                    if not raw_col10:
                        c_skipped += 1
                        continue

                    parts = [p.strip() for p in raw_col10.split('|')]
                    ma_kh = parts[0] if len(parts) > 0 else ''
                    ten_kh = parts[1] if len(parts) > 1 else ''
                    dien_thoai = parts[2] if len(parts) > 2 else ''
                    # Col11 có thể có thêm địa chỉ hoặc ghi chú
                    raw_col11 = r.get(11, '').strip()  # Col K
                    dia_chi = raw_col11 if raw_col11 and not raw_col11.startswith('0') else ''
                    tinh_tp = ''
                    ghi_chu = ''

                    if not ma_kh:
                        c_skipped += 1
                        continue

                    # Refresh DB connection mỗi 200 dòng
                    if idx > 0 and idx % 200 == 0:
                        from django.db import connection
                        connection.close()

                    for attempt in range(3):
                        try:
                            _, created = Customer.objects.update_or_create(
                                ma_kh=ma_kh,
                                defaults={
                                    'ten_kh': ten_kh,
                                    'dien_thoai': dien_thoai,
                                    'phan_loai': 'CHƯA_PL',
                                    'dia_chi': dia_chi,
                                    'tinh_tp': tinh_tp,
                                    'ghi_chu': ghi_chu,
                                }
                            )
                            if created:
                                c_created += 1
                            else:
                                c_updated += 1
                            break
                        except Exception as e:
                            if attempt < 2:
                                from django.db import connection
                                connection.close()
                                time.sleep(0.5)
                            else:
                                raise e

                    # Progress bar mỗi 5 dòng hoặc 1 giây
                    now = time.time()
                    if idx % 5 == 0 or now - last_print >= 1.0 or idx == total - 1:
                        last_print = now
                        pct = (idx + 1) / total * 100
                        bar_len = 30
                        filled = int(bar_len * (idx + 1) / total)
                        bar = '█' * filled + '░' * (bar_len - filled)
                        elapsed = now - t0
                        rate = (idx + 1) / elapsed if elapsed > 0 else 0
                        self.stdout.write(
                            f'\r  [{bar}] {pct:.0f}% ({idx+1}/{total}) '
                            f'| Mới:{c_created} Cập nhật:{c_updated} '
                            f'| {rate:.0f} kh/s',
                            ending=''
                        )
                        self.stdout.flush()

                self.stdout.write('')  # newline
                elapsed = time.time() - t0
                self.stdout.write(self.style.SUCCESS(
                    f'\n✅ Import khách hàng hoàn tất ({elapsed:.1f}s)!\n'
                    f'  🆕 Mới: {c_created}\n'
                    f'  🔄 Cập nhật: {c_updated}\n'
                    f'  ⏭️  Bỏ qua: {c_skipped}'
                ))

        except Exception as e:
            self.stderr.write(f'❌ ERROR: {e}')
            import traceback
            traceback.print_exc()
