"""Import BANG_GIA_BO_HOI_MOI_1.xlsx — Bộ hơi, Ron, Miếng, Phốt, Piston, Séc măng, Xy lanh..."""
from pathlib import Path

from .base import BaseExcelImporter, ImportResult, parse_price, parse_decimal


# Map sheet name keyword → (loai, category_slug, category_ten, order)
# Dùng chữ Việt chuẩn, hàm normalize sẽ bỏ dấu để match
SHEET_CATEGORY_MAP = {
    'PISTON': ('piston', 'piston', 'Piston', 10),
    'SÉC MĂNG': ('sec_mang', 'sec-mang', 'Séc măng', 11),
    'XY LANH CŨ': ('xy_lanh_cu', 'xy-lanh-cu', 'Xy lanh cũ', 14),
    'XY LANH': ('xy_lanh', 'xy-lanh', 'Xy lanh', 12),
    'RON BỘ': ('ron_bo', 'ron-bo', 'Ron bộ', 20),
    'RON MIẾNG': ('ron_mieng', 'ron-mieng', 'Ron miếng', 21),
    'MIẾNG TNC': ('mieng_bac', 'mieng-bac', 'Miếng bạc', 30),
    'MIẾNG TRA CỨU': ('mieng_bac', 'mieng-bac', 'Miếng bạc', 30),
    'BẠC THAU': ('can_thau', 'can-thau', 'Bạc thau', 31),
    'CĂN DỌC': ('can_doc', 'can-doc', 'Căn dóc', 32),
    'RON CÁT TE': ('ron_cat_te', 'ron-cat-te', 'Ron cát te', 22),
    'THUN CÒ': ('thun_co', 'thun-co', 'Thun cò', 23),
    'PHỐT ĐẦU TRỤC CƠ': ('phot_dau', 'phot-dau-truc-co', 'Phốt đầu trục cơ', 40),
    'PHỐT ĐUÔI TRỤC CƠ': ('phot_duoi', 'phot-duoi-truc-co', 'Phốt đuôi trục cơ', 41),
    'KÉT NƯỚC': ('ket_nuoc', 'ket-nuoc', 'Két nước', 73),
    'KÉT NHỚT': ('ket_nhot', 'ket-nhot', 'Két nhớt', 74),
    'KHÁCH HÀNG': ('_skip_customer', None, None, 0),
    'NHÀ XE': ('_skip_nhaxe', None, None, 0),
    'CHÚ GIẢI': ('_skip', None, None, 0),
    '_LOOKUP': ('_skip', None, None, 0),
    'TÍNH NHANH': ('_skip', None, None, 0),
    'BÁO GIÁ': ('_skip', None, None, 0),
    'BỘ HƠI': ('_skip', None, None, 0),
    'DATA': ('_skip', None, None, 0),
    'TRA CỨU NHANH': ('_skip', None, None, 0),
}

# Product sheets share this column structure (13 cols):
# A=STT, B=Mã VT, C=Tên hàng, D=Hãng, E=Đời TH SX, F=ĐVT,
# G=Giá vốn, H=Giá VIP, I=Giá Ưu đãi, J=Giá Đại lý, K=Giá Gara, L=Tên, M=Ghi chú
STANDARD_13_COLS = {
    'ma_vt': 2, 'ten_hang': 3, 'hang_may': 4, 'doi_th_sx': 5, 'dvt': 6,
    'gia_von': 7, 'gia_vip': 8, 'gia_uu_dai': 9, 'gia_dai_ly': 10, 'gia_gara': 11,
    'ghi_chu': 13,
}

# Miếng TNC columns (17 cols):
# A=Mã HH, B=Hãng, C=Mã ĐC, D=ĐK, E=Cos, F=Loại, G=Thương hiệu, H=ĐVT,
# I=Vốn, J=VIP, K=Ưu đãi, L=Đại lý, M=Gara, N=Tên, O=PARNO, P=Ghi chú, Q=Tên đầy đủ
MIENG_TNC_COLS = {
    'ma_vt': 1, 'ten_hang': 17, 'hang_may': 2, 'dvt': 8,
    'gia_von': 9, 'gia_vip': 10, 'gia_uu_dai': 11, 'gia_dai_ly': 12, 'gia_gara': 13,
    'parno': 15, 'ghi_chu': 16,
}

# Piston columns (21 cols)
PISTON_COLS = {
    'ma_vt': 1, 'ten_hang': 19, 'hang_may': 2, 'dvt': 12,
    'gia_von': 13, 'gia_vip': 14, 'gia_uu_dai': 15, 'gia_dai_ly': 16, 'gia_gara': 17,
    'ghi_chu': 18,
}

# Xy lanh columns (22 cols)
XY_LANH_COLS = {
    'ma_vt': 1, 'ten_hang': 19, 'hang_may': 2, 'dvt': 12,
    'gia_von': 13, 'gia_vip': 14, 'gia_uu_dai': 15, 'gia_dai_ly': 16, 'gia_gara': 17,
    'ghi_chu': 9,
}

# Séc măng columns (19 cols)
SEC_MANG_COLS = {
    'ma_vt': 1, 'ten_hang': 18, 'hang_may': 2, 'dvt': 9,
    'gia_von': 10, 'gia_vip': 11, 'gia_uu_dai': 12, 'gia_dai_ly': 13, 'gia_gara': 14,
    'ghi_chu': 17, 'parno': 16,
}

# Bạc thau + Căn dóc (11 cols): A=Mã HH, B=Tên vật tư, C=ĐVT, D=Vốn, E=VIP, F=Ưu đãi, G=Đại lý, H=Gara, I=Tồn, J=PARNO, K=Ghi chú
BAC_THAU_COLS = {
    'ma_vt': 1, 'ten_hang': 2, 'dvt': 3,
    'gia_von': 4, 'gia_vip': 5, 'gia_uu_dai': 6, 'gia_dai_ly': 7, 'gia_gara': 8,
    'parno': 10, 'ghi_chu': 11,
}

# Két nước/Két nhớt (11 cols): A=Mã HH, B=Hãng SX, C=Tên két, D=Cao, E=Rộng, F=Dày, G=PARNO, H=ĐVT, I=Giá bán, J=Đại lý, K=VIP
KET_NUOC_COLS = {
    'ma_vt': 1, 'ten_hang': 3, 'hang_may': 2, 'dvt': 8,
    'gia_von': 9, 'gia_dai_ly': 10, 'gia_vip': 11,
    'parno': 7,
}

# Sheet-specific column maps
SHEET_COL_MAP = {
    'sec_mang': SEC_MANG_COLS,
    'piston': PISTON_COLS,
    'xy_lanh': XY_LANH_COLS,
    'xy_lanh_cu': XY_LANH_COLS,
    'mieng_bac': MIENG_TNC_COLS,
    'can_thau': BAC_THAU_COLS,
    'can_doc': BAC_THAU_COLS,
    'ket_nuoc': KET_NUOC_COLS,
    'ket_nhot': KET_NUOC_COLS,
}


def remove_diacritics(text: str) -> str:
    """Bỏ dấu tiếng Việt: Ế→E, Ộ→O, Đ→D..."""
    import unicodedata
    # Tách dấu khỏi ký tự cơ bản
    nfkd = unicodedata.normalize('NFKD', text)
    # Chỉ giữ ký tự ASCII (bỏ combining marks)
    ascii_text = nfkd.encode('ascii', 'ignore').decode('ascii')
    return ascii_text


def strip_emoji(text: str) -> str:
    """Loại bỏ emoji và ký tự đặc biệt, giữ lại chữ + số."""
    import re
    return re.sub(r'[^\w\s\-]', '', text, flags=re.UNICODE).strip()


def normalize_sheet_name(sname: str) -> str:
    """Chuẩn hóa tên sheet: strip emoji → bỏ dấu → uppercase."""
    clean = strip_emoji(sname)
    no_diacritics = remove_diacritics(clean)
    return no_diacritics.upper().strip()


def normalize_keyword(keyword: str) -> str:
    """Chuẩn hóa keyword: thay ? bằng ký tự bất kỳ → bỏ dấu → uppercase."""
    # Thay dấu ? bằng ký tự đại diện
    clean = keyword.replace('?', '')
    no_diacritics = remove_diacritics(clean)
    return no_diacritics.upper().strip()


def detect_sheet_category(sname: str):
    """Dò category từ tên sheet (fuzzy match sau khi normalize)."""
    norm_name = normalize_sheet_name(sname)
    for keyword, (loai, slug, ten, order) in SHEET_CATEGORY_MAP.items():
        if loai.startswith('_skip'):
            # Exact match cho skip keywords
            norm_kw = normalize_keyword(keyword)
            if norm_kw in norm_name:
                return loai, slug, ten, order
        else:
            norm_kw = normalize_keyword(keyword)
            if norm_kw in norm_name:
                return loai, slug, ten, order
    return None, None, None, 0


class BoHoiMoiImporter(BaseExcelImporter):
    file_pattern = 'BANG_GIA_BO_HOI_MOI*.xlsx'
    importer_name = 'bo-hoi-moi'

    def import_file(self, file_path: Path) -> ImportResult:
        self.result = ImportResult(file_name=file_path.name)
        zf, sheets = self.open_excel(file_path)
        self.log(f'Found {len(sheets)} sheets')

        for sname, target in sheets:
            loai, cat_slug, cat_ten, cat_order = detect_sheet_category(sname)

            if loai and loai.startswith('_skip'):
                self.log(f'Skipping sheet: "{sname}"')
                continue

            if not loai:
                self.log(f'UNKNOWN sheet: "{sname}" — skipping')
                continue

            category = self.get_category(cat_slug, cat_ten, '', cat_order)
            col_map = SHEET_COL_MAP.get(loai, STANDARD_13_COLS)
            self.log(f'Processing: "{sname}" → {loai} ({cat_ten}) with {len(col_map)} col mappings')

            rows = self.parse_rows(zf, target)

            for ri in sorted(rows):
                r = rows[ri]

                ma_vt = r.get(col_map.get('ma_vt', 2), '').strip()
                if not ma_vt or ma_vt.upper() in ('STT', 'MÃ VT', 'MÃ HH', 'M? VT', 'M? HH', '?? M? HH'):
                    continue  # Skip header

                ten_hang = r.get(col_map.get('ten_hang', 3), '').strip()
                if not ten_hang or ten_hang.startswith('🏭') or ten_hang.startswith('?'):
                    continue

                hang_may_name = r.get(col_map.get('hang_may', 4), '').strip()

                hm = self.get_hang_may(hang_may_name)

                dvt = r.get(col_map.get('dvt', 6), '').strip()
                doi_th_sx = r.get(col_map.get('doi_th_sx', 5), '').strip()
                parno = r.get(col_map.get('parno', 0), '').strip()

                # Parse prices
                gia_von = parse_price(r.get(col_map.get('gia_von', 7), ''))
                gia_vip = parse_price(r.get(col_map.get('gia_vip', 8), ''))
                gia_uu_dai = parse_price(r.get(col_map.get('gia_uu_dai', 9), ''))
                gia_dai_ly = parse_price(r.get(col_map.get('gia_dai_ly', 10), ''))
                gia_gara = parse_price(r.get(col_map.get('gia_gara', 11), ''))
                ghi_chu = r.get(col_map.get('ghi_chu', 13), '').strip()

                # Build attributes from category-specific columns
                attrs = {}
                if loai == 'piston':
                    attrs = {
                        'dk': r.get(4, '').strip(),        # ĐK
                        'ky_hieu': r.get(5, '').strip(),    # Ký hiệu (A/A+0)
                        'buong_no': r.get(6, '').strip(),   # Buồng nổ
                        'ac': r.get(7, '').strip(),         # Ắc
                        'ac_dinh': r.get(8, '').strip(),    # Ắc định
                        'tong_dai': r.get(9, '').strip(),   # Tổng dài
                        'ring': r.get(10, '').strip(),      # Ring 1-5
                        'thuong_hieu': r.get(11, '').strip(),
                    }
                elif loai == 'sec_mang':
                    attrs = {
                        'loai_mo': r.get(5, '').strip(),
                        'ring': r.get(6, '').strip(),
                        'thuong_hieu': r.get(7, '').strip(),
                    }
                elif loai in ('xy_lanh', 'xy_lanh_cu'):
                    attrs = {
                        'so_may': r.get(4, '').strip(),
                        'kieu': r.get(5, '').strip(),
                        'xoay': r.get(6, '').strip(),
                        'doa': r.get(7, '').strip(),
                        'thong_so': r.get(8, '').strip(),
                        'thuong_hieu': r.get(10, '').strip(),
                        'dk': r.get(11, '').strip(),
                    }
                elif loai == 'mieng_bac':
                    attrs = {
                        'ma_dc': r.get(3, '').strip(),
                        'dk': r.get(4, '').strip(),
                        'cos': r.get(5, '').strip(),
                        'loai_mieng': r.get(6, '').strip(),
                        'cung_trong': r.get(6, '').strip() if 'CUNG' in str(r.get(6, '')) else '',
                    }
                elif loai == 'can_thau':
                    attrs = {
                        'cung_trong': r.get(6, '').strip(),
                        'cung_ngoai': r.get(7, '').strip(),
                        'cao': r.get(8, '').strip(),
                        'day': r.get(9, '').strip(),
                    }
                elif loai in ('phot_dau', 'phot_duoi'):
                    attrs = {
                        'kich_thuoc': r.get(5, '').strip(),
                        'thuong_hieu': r.get(6, '').strip(),
                    }

                defaults = {
                    'category': category,
                    'hang_may': hm,
                    'ten_hang': ten_hang,
                    'dvt': dvt,
                    'doi_th_sx': doi_th_sx,
                    'parno': parno,
                    'gia_von': gia_von,
                    'gia_vip': gia_vip,
                    'gia_uu_dai': gia_uu_dai,
                    'gia_dai_ly': gia_dai_ly,
                    'gia_gara': gia_gara,
                    'ghi_chu': ghi_chu,
                    'sheet_name': sname,
                    'attributes': attrs,
                }

                self.add_to_batch(ma_vt, loai, defaults)

        self.flush_batch()
        zf.close()
        self.log(f'Done: {self.result.created} created, {self.result.updated} updated')
        return self.result
