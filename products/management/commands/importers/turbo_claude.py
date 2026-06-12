"""Import BÁO_GIÁ_TURBO CLAUDE.xlsx — Turbo + Ruột KHÔNG GIÁ (fallback)."""
from pathlib import Path

from .base import BaseExcelImporter, ImportResult, parse_price, parse_decimal


class TurboClaudeImporter(BaseExcelImporter):
    file_pattern = 'BÁO_GIÁ_TURBO CLAUDE.xlsx'
    importer_name = 'turbo-claude'

    def import_file(self, file_path: Path) -> ImportResult:
        self.result = ImportResult(file_name=file_path.name)
        zf, sheets = self.open_excel(file_path)
        self.log(f'Found {len(sheets)} sheets')

        turbo_cat = self.get_category('turbo', 'Turbo', 'Turbo tăng áp đầy đủ', 1)
        ruot_cat = self.get_category('ruot-turbo', 'Ruột Turbo', 'Ruột turbo (CHRA)', 2)

        for sheet_idx in [2, 3]:  # Sheet 3: BÁO GIÁ TURBO, Sheet 4: RUỘT TURBO
            if sheet_idx >= len(sheets):
                continue
            sname, target = sheets[sheet_idx]
            loai = 'ruot' if 'RUỘT' in sname.upper() else 'turbo'
            category = ruot_cat if loai == 'ruot' else turbo_cat
            self.log(f'Processing: "{sname}" → loai={loai}')

            rows = self.parse_rows(zf, target)

            for ri in sorted(rows):
                if ri <= 3:
                    continue
                r = rows[ri]

                ma_vt = r.get(2, '').strip()
                if not ma_vt:
                    continue

                hang_may_name = r.get(1, '').strip()
                if '🏭' in hang_may_name or 'loại' in hang_may_name or 'lo?i' in hang_may_name:
                    continue

                # Skip products that already have prices from v13 import
                if not self.overwrite_prices:
                    from products.models import Product
                    existing = Product.objects.filter(ma_vt=ma_vt, loai=loai).first()
                    if existing and (existing.gia_vip or existing.gia_uu_dai or existing.gia_dai_ly):
                        continue  # Skip — already has prices from v13

                hang_sx_name = r.get(3, '').strip()
                model_turbo = r.get(4, '').strip()
                ma_dong_co = r.get(5, '').strip()
                oem_part_no = r.get(6, '').strip()

                if loai == 'turbo':
                    dac_diem = r.get(7, '').strip()
                    ung_dung = r.get(8, '').strip()
                    ghi_chu = r.get(9, '').strip()
                    thuong_hieu_name = r.get(10, '').strip()
                    col_offset = 0
                else:
                    dac_diem = ''
                    ung_dung = ''
                    ghi_chu = r.get(7, '').strip()
                    thuong_hieu_name = r.get(8, '').strip()
                    col_offset = -2

                hm = self.get_hang_may(hang_may_name)
                hs = self.get_hang_sx(hang_sx_name)
                th = self.get_thuong_hieu(thuong_hieu_name)

                # Claude file: GIÁ VIP, GIÁ ƯU ĐÃI, GIÁ ĐẠI LÝ, GIÁ ĐL+10%
                pc = 11 + col_offset
                gia_vip = parse_price(r.get(pc, ''))         # Col K = GIÁ VIP
                gia_uu_dai = parse_price(r.get(pc + 1, ''))   # Col L = GIÁ ƯU ĐÃI
                gia_dai_ly = parse_price(r.get(pc + 2, ''))   # Col M = GIÁ ĐẠI LÝ
                gia_dl_10 = parse_price(r.get(pc + 3, ''))    # Col N = GIÁ ĐL+10%

                cg_duoi = parse_decimal(r.get(15 + col_offset, ''))
                cg_dinh = parse_decimal(r.get(16 + col_offset, ''))
                cg_so = r.get(17 + col_offset, '').strip()
                cl_duoi = parse_decimal(r.get(18 + col_offset, ''))
                cl_dinh = parse_decimal(r.get(19 + col_offset, ''))
                cl_so = r.get(20 + col_offset, '').strip()

                defaults = {
                    'category': category,
                    'hang_may': hm, 'hang_sx': hs, 'thuong_hieu': th,
                    'ten_hang': model_turbo,
                    'model_turbo': model_turbo, 'ma_dong_co': ma_dong_co,
                    'oem_part_no': oem_part_no, 'dac_diem': dac_diem,
                    'ung_dung': ung_dung, 'ghi_chu': ghi_chu,
                    'gia_vip': gia_vip, 'gia_uu_dai': gia_uu_dai,
                    'gia_dai_ly': gia_dai_ly, 'gia_dl_10': gia_dl_10,
                    'cg_duoi': cg_duoi, 'cg_dinh': cg_dinh, 'cg_so': cg_so,
                    'cl_duoi': cl_duoi, 'cl_dinh': cl_dinh, 'cl_so': cl_so,
                    'sheet_name': sname,
                }

                self.add_to_batch(ma_vt, loai, defaults)

        self.flush_batch()
        zf.close()
        self.log(f'Done: {self.result.created} created, {self.result.updated} updated')
        return self.result
