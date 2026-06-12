"""Import KET NUOC.docx — Danh sách két nước (radiator)."""
import re
from pathlib import Path

from .base import BaseExcelImporter, ImportResult


class KetNuocImporter(BaseExcelImporter):
    """Import từ Word docx — parse các dòng text thành Product."""

    file_pattern = 'KET NUOC.docx'
    importer_name = 'ket-nuoc'

    def import_file(self, file_path: Path) -> ImportResult:
        self.result = ImportResult(file_name=file_path.name)
        category = self.get_category('ket-nuoc', 'Két nước', 'Két nước / Radiator', 73)

        try:
            from docx import Document
            doc = Document(str(file_path))
        except Exception as e:
            self.result.errors.append(f'Cannot open docx: {e}')
            self.result.status = 'FAILED'
            return self.result

        count = 0
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            # Pattern: "KÉT NƯỚC PC200-3" hoặc "PC200-8 MO" hoặc "KÉT NƯỚC EX120-1"
            # Có dòng bắt đầu bằng "KÉT NƯỚC", có dòng chỉ là model
            is_header = text.upper().startswith('KÉT NƯỚC') or text.upper().startswith('KET NUOC')

            if is_header:
                model = re.sub(r'^K[EÉ]T\s*N[ƯU]ỚC\s*', '', text, flags=re.IGNORECASE).strip()
            else:
                model = text

            if not model or len(model) < 3:
                continue

            # Generate mã VT
            ma_vt = 'KN' + re.sub(r'[^A-Z0-9]', '', model.upper())[:20]
            if len(ma_vt) < 5:
                ma_vt = f'KN{count:04d}'

            # Try to extract machine brand from model
            hang_may_name = 'CHƯA RÕ'
            brand_patterns = [
                (r'^(PC|EX|SK|SH|DH|DX|ZX|EC|HD|WA|IHI|R\d)', 'KOMATSU'),
                (r'^(PC|EX)', 'KOMATSU'),
                (r'^(EX|ZX)', 'HITACHI'),
                (r'^(SK|SH)', 'KOBELCO'),
                (r'^(DH|DX)', 'DOOSAN'),
                (r'^(EC)', 'VOLVO'),
                (r'^(HD)', 'HYUNDAI'),
                (r'^(E\d|E3)', 'CAT'),
                (r'^(R\d)', 'HYUNDAI'),
                (r'^(WA)', 'KOMATSU'),
                (r'^(YANMAR|IHI)', 'YANMAR'),
            ]
            for pattern, brand in brand_patterns:
                if re.match(pattern, model.upper()):
                    hang_may_name = brand
                    break

            hm = self.get_hang_may(hang_may_name)

            defaults = {
                'category': category,
                'hang_may': hm,
                'ten_hang': f'Két nước {model}',
                'dvt': 'Cái',
                'sheet_name': 'KET NUOC',
                'attributes': {
                    'model_may': model,
                    'loai': 'Két nước',
                },
            }

            self.add_to_batch(ma_vt, 'ket_nuoc', defaults)
            count += 1

        self.flush_batch()
        self.log(f'Done: {self.result.created} created, {self.result.updated} updated (total {count} lines)')
        return self.result
