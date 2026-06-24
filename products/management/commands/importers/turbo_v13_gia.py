"""Import BAO_GIA_TURBO_v13_GIA.xlsx — Turbo + Ruột CÓ GIÁ (ưu tiên cao nhất)."""
from pathlib import Path

from .base import BaseExcelImporter, ImportResult, parse_price, parse_decimal


class TurboV13GiaImporter(BaseExcelImporter):
    file_pattern = 'BAO_GIA_TURBO_v13_GIA*.xlsx'
    importer_name = 'turbo-v13-gia'

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
                if ri <= 3:  # Skip header rows
                    continue
                r = rows[ri]

                ma_vt = r.get(2, '').strip()  # Col B
                if not ma_vt:
                    continue

                hang_may_name = r.get(1, '').strip()  # Col A
                if '🏭' in hang_may_name or 'loại' in hang_may_name:
                    continue

                hang_sx_name = r.get(3, '').strip()  # Col C
                model_turbo = r.get(4, '').strip()  # Col D
                ma_dong_co = r.get(5, '').strip()  # Col E
                oem_part_no = r.get(6, '').strip()  # Col F

                # v13: CẢ turbo và ruột đều có đầy đủ cột (23 cols)
                dac_diem = r.get(7, '').strip()    # Col G
                ung_dung = r.get(8, '').strip()    # Col H
                ghi_chu = r.get(9, '').strip()     # Col I
                thuong_hieu_name = r.get(10, '').strip()  # Col J

                hm = self.get_hang_may(hang_may_name)
                hs = self.get_hang_sx(hang_sx_name)
                th = self.get_thuong_hieu(thuong_hieu_name)

                # Prices — columns K-N (11-14)
                # v13 column order: GIÁ BÁN, GIÁ ƯU ĐÃI, GIÁ VIP, GIÁ ĐL+10%
                # Our DB: gia_vip, gia_uu_dai, gia_dai_ly, gia_dl_10
                # Map: GIÁ BÁN → gia_dai_ly, GIÁ ƯU ĐÃI → gia_uu_dai, GIÁ VIP → gia_vip
                gia_ban = parse_price(r.get(11, ''))       # Col K = GIÁ BÁN (→ gia_dai_ly)
                gia_uu_dai = parse_price(r.get(12, ''))     # Col L = GIÁ ƯU ĐÃI
                gia_vip = parse_price(r.get(13, ''))        # Col M = GIÁ VIP
                gia_dl_10 = parse_price(r.get(14, ''))      # Col N = GIÁ ĐL+10%

                # CG/CL — columns O-T (15-20)
                cg_duoi = parse_decimal(r.get(15, ''))
                cg_dinh = parse_decimal(r.get(16, ''))
                cg_so = r.get(17, '').strip()
                cl_duoi = parse_decimal(r.get(18, ''))
                cl_dinh = parse_decimal(r.get(19, ''))
                cl_so = r.get(20, '').strip()

                defaults = {
                    'category': category,
                    'hang_may': hm, 'hang_sx': hs, 'thuong_hieu': th,
                    'ten_hang': model_turbo,
                    'model_turbo': model_turbo, 'ma_dong_co': ma_dong_co,
                    'oem_part_no': oem_part_no, 'dac_diem': dac_diem,
                    'ung_dung': ung_dung, 'ghi_chu': ghi_chu,
                    'gia_vip': gia_vip, 'gia_uu_dai': gia_uu_dai,
                    'gia_dai_ly': gia_ban, 'gia_dl_10': gia_dl_10,
                    'cg_duoi': cg_duoi, 'cg_dinh': cg_dinh, 'cg_so': cg_so,
                    'cl_duoi': cl_duoi, 'cl_dinh': cl_dinh, 'cl_so': cl_so,
                    'sheet_name': sname,
                    'attributes': {
                        'model_turbo': model_turbo,
                        'ma_dong_co': ma_dong_co,
                        'oem_part_no': oem_part_no,
                    },
                }

                self.add_to_batch(ma_vt, loai, defaults)

        self.flush_batch()
        zf.close()
        self.log(f'Done: {self.result.created} created, {self.result.updated} updated')
        return self.result
