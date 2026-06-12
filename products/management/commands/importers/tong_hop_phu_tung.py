"""Import TONG_HOP_PHU_TUNG_10062026_1.xlsx — 17 sheets phụ tùng tổng hợp."""
from pathlib import Path

from .base import BaseExcelImporter, ImportResult, parse_price


# Map sheet name → (loai, category_slug, category_ten, order)
# Dùng chữ Việt chuẩn, hàm normalize sẽ bỏ dấu để match
SHEET_MAP = {
    'SUPAP': ('supap', 'supap', 'Supap', 50),
    'TRỤC CƠ': ('truc_co', 'truc-co', 'Trục cơ', 51),
    'BƠM NƯỚC': ('bom_nuoc', 'bom-nuoc', 'Bơm nước', 60),
    'NẮP QUY LÁT': ('nap_quy_lat', 'nap-quy-lat', 'Nắp quy lát', 70),
    'BƠM NHỚT': ('bom_nhot', 'bom-nhot', 'Bơm nhớt', 61),
    'TRỤC CAM': ('truc_cam', 'truc-cam', 'Trục cam', 52),
    'NẮP SINH HÀN': ('nap_sinh_han', 'nap-sinh-han', 'Nắp sinh hàn', 71),
    'RUỘT SINH HÀN': ('ruot_sinh_han', 'ruot-sinh-han', 'Ruột sinh hàn', 72),
    'NHÍP TAY BIÊN': ('nhip_tay_bien', 'nhip-tay-bien', 'Nhíp tay biên', 33),
    'THUN RON': ('thun_co', 'thun-co', 'Thun cò', 23),
    'THUN XY LANH': ('thun_xy_lanh', 'thun-xy-lanh', 'Thun xy lanh', 24),
    'LỌC MÁY': ('loc_may', 'loc-may', 'Lọc máy', 80),
    'SAM BẠC': ('sam_bac', 'sam-bac', 'Sam bạc', 32),
    'VAN HẰNG NHIỆT': ('van_hang_nhiet', 'van-hang-nhiet', 'Van hằng nhiệt', 81),
    'VÀNH RĂNG BÁNH ĐÀ': ('vanh_rang_banh_da', 'vanh-rang-banh-da', 'Vành răng bánh đà', 82),
    'ỐNG DẪN NHIÊN LIỆU': ('ong_dan_nhien_lieu', 'ong-dan-nhien-lieu', 'Ống dẫn nhiên liệu', 83),
    'SÊN CAM': ('sen_cam', 'sen-cam', 'Sên cam', 53),
}


def remove_diacritics(text: str) -> str:
    """Bỏ dấu tiếng Việt."""
    import unicodedata
    nfkd = unicodedata.normalize('NFKD', text)
    return nfkd.encode('ascii', 'ignore').decode('ascii')


def strip_emoji(text: str) -> str:
    """Loại bỏ emoji và ký tự đặc biệt, giữ lại chữ + số."""
    import re
    return re.sub(r'[^\w\s\-]', '', text, flags=re.UNICODE).strip()


def normalize(text: str) -> str:
    """Chuẩn hóa: strip emoji → bỏ dấu → uppercase."""
    return remove_diacritics(strip_emoji(text)).upper().strip()


def match_sheet(sname: str):
    """Fuzzy match tên sheet (normalize cả 2 phía)."""
    norm_name = normalize(sname)
    for keyword, info in SHEET_MAP.items():
        if normalize(keyword) in norm_name:
            return info
    return None


class TongHopPhuTungImporter(BaseExcelImporter):
    file_pattern = 'TONG_HOP_PHU_TUNG_10062026_1.xlsx'
    importer_name = 'tong-hop'

    def import_file(self, file_path: Path) -> ImportResult:
        self.result = ImportResult(file_name=file_path.name)
        zf, sheets = self.open_excel(file_path)
        self.log(f'Found {len(sheets)} sheets')

        for sname, target in sheets:
            info = match_sheet(sname)
            if not info:
                self.log(f'UNKNOWN sheet: "{sname}" — skipping')
                continue

            loai, cat_slug, cat_ten, cat_order = info
            category = self.get_category(cat_slug, cat_ten, '', cat_order)
            self.log(f'Processing: "{sname}" → {loai}')

            rows = self.parse_rows(zf, target)

            for ri in sorted(rows):
                r = rows[ri]

                # Cột: A=Mã HH, B=Hãng máy, C=Tên động cơ, D=PARNO, E=Giá, F=Ghi chú
                ma_hh = r.get(1, '').strip()
                if not ma_hh or ma_hh.startswith('??') or ma_hh.startswith('?') or ma_hh.upper() in ('MÃ HH', 'M? HH', '?? M? HH', ''):
                    continue

                hang_may_name = r.get(2, '').strip()
                ten_dong_co = r.get(3, '').strip()
                parno = r.get(4, '').strip()
                gia = parse_price(r.get(5, ''))
                ghi_chu = r.get(6, '').strip()

                # Dòng header của hãng (VD: "HINO   (14 sản phẩm)")
                if not ma_hh.startswith('HH') and not ma_hh.startswith('hh'):
                    continue

                # Combine tên
                ten_hang = ten_dong_co
                if hang_may_name and hang_may_name not in ten_hang:
                    ten_hang = f"{ten_dong_co} - {hang_may_name}"

                hm = self.get_hang_may(hang_may_name)

                defaults = {
                    'category': category,
                    'hang_may': hm,
                    'ten_hang': ten_hang,
                    'parno': parno,
                    'ghi_chu': ghi_chu,
                    'sheet_name': sname,
                    'attributes': {
                        'ten_dong_co': ten_dong_co,
                        'parno': parno,
                    },
                }
                # Gán giá vào gia_vip (chỉ có 1 cột giá duy nhất)
                if gia is not None:
                    defaults['gia_vip'] = gia

                self.add_to_batch(ma_hh, loai, defaults)

        self.flush_batch()
        zf.close()
        self.log(f'Done: {self.result.created} created, {self.result.updated} updated')
        return self.result
