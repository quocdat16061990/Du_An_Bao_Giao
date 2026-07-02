#!/usr/bin/env python3
"""Sync Customers & NhaXe v2 — batch processing, chi them moi, khong update."""
import re, zipfile, sys, time
from pathlib import Path
from xml.etree import ElementTree as ET

import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / 'backend' / '.env')
django.setup()

from products.models import Customer, NhaXe
from django.db import connection

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
NS_REL = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships',
          'office': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}


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


def read_sheet_rows(zf, target):
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
    return rows


def main():
    file_path = Path('docs/BAO_GIA_TURBO_v13_GIA_CO_ANH.xlsx')
    if not file_path.exists():
        print(f'ERROR: File not found: {file_path}')
        return

    print(f'Opening: {file_path}')
    t_start = time.time()

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
            rid = sh.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id', '')
            sheets.append((sh.attrib.get('name', '?'), rel_targets.get(rid, '')))

        print(f'Sheets: {len(sheets)}')
        for i, (name, _) in enumerate(sheets):
            print(f'  {i+1}: "{name}"')

        # ═══════════════ STEP 1: NHA XE ═══════════════
        print(f'\n{"="*50}')
        print('STEP 1: Import NHA XE')
        print(f'{"="*50}')

        existing_nx = set(NhaXe.objects.values_list('ten_nha_xe', flat=True))
        print(f'  Existing NhaXe in DB: {len(existing_nx)}')

        new_nx_batch = []
        nx_processed = 0

        for sname, target in sheets:
            if 'NHÀ XE' in sname.upper() or 'NHA XE' in sname.upper():
                print(f'  Reading sheet: "{sname}"')
                rows = read_sheet_rows(zf, target)

                for ri in sorted(rows):
                    if ri <= 6:
                        continue
                    r = rows[ri]
                    ten = r.get(1, '').strip() or r.get(2, '').strip()
                    if not ten or 'STT' in ten.upper() or 'CHÀNH' in ten.upper():
                        continue
                    if len(ten) > 300:
                        ten = ten[:300]

                    if ten not in existing_nx:
                        dt = r.get(3, '').strip()[:20]
                        dia_chi = r.get(4, '').strip()
                        gio_nhan = r.get(5, '').strip()[:100]
                        ghi_chu = r.get(6, '').strip()
                        new_nx_batch.append(NhaXe(
                            ten_nha_xe=ten,
                            dien_thoai=dt if dt else '',
                            dia_chi=dia_chi if dia_chi else '',
                            gio_nhan=gio_nhan if gio_nhan else '',
                            ghi_chu=ghi_chu if ghi_chu else '',
                        ))
                        existing_nx.add(ten)

                    nx_processed += 1
                    if len(new_nx_batch) >= 50:
                        NhaXe.objects.bulk_create(new_nx_batch, ignore_conflicts=True)
                        print(f'    NhaXe: {nx_processed} processed, {len(existing_nx)} total unique...', end='\r')
                        new_nx_batch = []

                if new_nx_batch:
                    NhaXe.objects.bulk_create(new_nx_batch, ignore_conflicts=True)
                print(f'\n  NhaXe done: {nx_processed} rows -> {len(existing_nx)} unique names')
                break

        # Refresh NhaXe cache
        nha_xe_map = {nx.ten_nha_xe.lower(): nx for nx in NhaXe.objects.all()}
        print(f'  NhaXe in DB after import: {NhaXe.objects.count()}')

        # ═══════════════ STEP 2: KHACH HANG ═══════════════
        print(f'\n{"="*50}')
        print('STEP 2: Import KHACH HANG')
        print(f'{"="*50}')

        existing_ma_kh = set(Customer.objects.values_list('ma_kh', flat=True))
        print(f'  Existing Customers in DB: {len(existing_ma_kh)}')

        new_kh_batch = []
        kh_processed = 0
        kh_new = 0

        for sname, target in sheets:
            if 'KH' in sname.upper() and 'DANH' in sname.upper():
                print(f'  Reading sheet: "{sname}"')
                rows = read_sheet_rows(zf, target)

                for ri in sorted(rows):
                    if ri <= 2:
                        continue
                    r = rows[ri]

                    ma_kh = r.get(2, '').strip()
                    ten_kh = r.get(3, '').strip()
                    dien_thoai = r.get(4, '').strip()
                    phan_loai_raw = r.get(5, '').strip().upper()
                    dia_chi = r.get(6, '').strip()
                    tinh_tp = r.get(7, '').strip()
                    ghi_chu = r.get(8, '').strip()
                    nha_xe_name = r.get(9, '').strip()

                    if not ma_kh:
                        continue
                    if ma_kh in existing_ma_kh:
                        kh_processed += 1
                        continue

                    # Map phan_loai
                    phan_loai = 'CHUA_PL'
                    if 'VIP' in phan_loai_raw:
                        phan_loai = 'NGOAI_LE' if ('NGOAI' in phan_loai_raw or 'LE' in phan_loai_raw) else 'VIP'
                    elif 'UU' in phan_loai_raw or 'ƯU' in phan_loai_raw:
                        phan_loai = 'UU_DAI'
                    elif 'DAI' in phan_loai_raw or 'ĐẠI' in phan_loai_raw:
                        phan_loai = 'DAI_LY'
                    elif 'GARA' in phan_loai_raw:
                        phan_loai = 'GARA'

                    # Find nha_xe
                    nha_xe_obj = None
                    if nha_xe_name:
                        nha_xe_obj = nha_xe_map.get(nha_xe_name.lower()[:100])

                    new_kh_batch.append(Customer(
                        ma_kh=ma_kh,
                        ten_kh=ten_kh[:300] if ten_kh else 'Chua co ten',
                        dien_thoai=dien_thoai[:20] if dien_thoai else '',
                        phan_loai=phan_loai,
                        dia_chi=dia_chi if dia_chi else '',
                        tinh_tp=tinh_tp[:100] if tinh_tp else '',
                        ghi_chu=ghi_chu if ghi_chu else '',
                        nha_xe=nha_xe_obj,
                    ))
                    existing_ma_kh.add(ma_kh)
                    kh_new += 1
                    kh_processed += 1

                    if len(new_kh_batch) >= 200:
                        Customer.objects.bulk_create(new_kh_batch, ignore_conflicts=True)
                        connection.close()
                        print(f'    KH: {kh_processed} processed, {kh_new} new...', end='\r')
                        new_kh_batch = []

                if new_kh_batch:
                    Customer.objects.bulk_create(new_kh_batch, ignore_conflicts=True)

                print(f'\n  KH done: {kh_processed} rows, {kh_new} new')
                break

    elapsed = time.time() - t_start
    print(f'\n{"="*50}')
    print(f'IMPORT COMPLETE ({elapsed:.1f}s)')
    print(f'{"="*50}')
    print(f'  Customers total: {Customer.objects.count()}')
    print(f'  NhaXe total:     {NhaXe.objects.count()}')


if __name__ == '__main__':
    main()
