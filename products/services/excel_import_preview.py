"""Preview and commit product Excel imports without storing temporary DB state."""
from __future__ import annotations

import os
import re
import tempfile
import zipfile
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Callable, Iterable

from django.db import transaction
from django.utils.text import slugify
from products.models import HangMay, HangSx, ImportLog, Product, ThuongHieu
from products.management.commands.importers.base import (
    ImportResult,
    NS,
    NS_REL,
    cell_text,
    col_to_index,
    load_shared_strings,
    parse_decimal,
    parse_price,
)
from products.management.commands.importers.bo_hoi_moi import (
    SHEET_COL_MAP as BO_HOI_SHEET_COL_MAP,
    STANDARD_13_COLS as BO_HOI_STANDARD_13_COLS,
    detect_sheet_category,
)
from products.management.commands.importers.bo_hoi_moi import BoHoiMoiImporter
from products.management.commands.importers.tong_hop_phu_tung import (
    match_sheet as match_tong_hop_sheet,
)
from products.management.commands.importers.tong_hop_phu_tung import TongHopPhuTungImporter
from products.management.commands.importers.turbo_claude import TurboClaudeImporter
from products.management.commands.importers.turbo_v13_gia import TurboV13GiaImporter


MAX_PREVIEW_ROWS = 10000
PRICE_FIELDS = {
    'gia_von': 'Gia von',
    'gia_vip': 'Gia VIP',
    'gia_uu_dai': 'Gia uu dai',
    'gia_dai_ly': 'Gia dai ly',
    'gia_gara': 'Gia gara',
    'gia_dl_10': 'Gia DL+10',
}

SYNC_TEXT_FIELDS = {
    'TEN_HANG': 'ten_hang',
    'TEN_DONG_CO': 'ten_hang',
    'MODEL': 'model_turbo',
    'MODEL_TURBO': 'model_turbo',
    'MA_DONG_CO': 'ma_dong_co',
    'OEM': 'oem_part_no',
    'OEM_PART_NO': 'oem_part_no',
    'PART_NO': 'oem_part_no',
    'DAC_DIEM': 'dac_diem',
    'UNG_DUNG': 'ung_dung',
    'GHI_CHU': 'ghi_chu',
    'DVT': 'dvt',
    'DOI_TH_SX': 'doi_th_sx',
    'PARNO': 'parno',
    'CG_SO': 'cg_so',
    'CL_SO': 'cl_so',
}
SYNC_PRICE_FIELDS = {
    'GIA_BAN': 'gia_dai_ly',
    'GIA_DAI_LY': 'gia_dai_ly',
    'GIA_DL': 'gia_dai_ly',
    'GIA_GARA': 'gia_gara',
    'GIA_VON': 'gia_von',
    'GIA_UU_DAI': 'gia_uu_dai',
    'GIA_VIP': 'gia_vip',
    'GIA_DL_10': 'gia_dl_10',
}
SYNC_DECIMAL_FIELDS = {
    'CG_DUOI': 'cg_duoi',
    'CG_DINH': 'cg_dinh',
    'CL_DUOI': 'cl_duoi',
    'CL_DINH': 'cl_dinh',
}
SYNC_FK_FIELDS = {
    'HANG_MAY': 'hang_may',
    'HANG_SX': 'hang_sx',
    'THUONG_HIEU': 'thuong_hieu',
}
MA_VT_HEADERS = {'MA_VT', 'MA_HH'}


def index_to_col_letters(index: int) -> str:
    """Convert a 1-based column index to Excel letters."""
    letters = ''
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(ord('A') + remainder) + letters
    return letters


@dataclass
class PreviewCandidate:
    sheet_name: str
    row_number: int
    ma_vt: str
    loai: str
    ten_hang: str = ''
    hang_may: str = ''
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    action: str = 'SKIP'


class PreviewError(Exception):
    """Raised when the uploaded file cannot be previewed."""


def save_upload_to_temp(uploaded_file) -> Path:
    """Persist an uploaded file to a temp path for ZipFile-based importers."""
    suffix = Path(uploaded_file.name).suffix or '.xlsx'
    fd, raw_path = tempfile.mkstemp(prefix='excel-import-', suffix=suffix)
    os.close(fd)
    path = Path(raw_path)
    with path.open('wb') as target:
        for chunk in uploaded_file.chunks():
            target.write(chunk)
    return path


def remove_temp_file(path: Path | None) -> None:
    if not path:
        return
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


def _normalize(text: str) -> str:
    import unicodedata

    source = (text or '').replace('đ', 'd').replace('Đ', 'D')
    source = source.replace('Ø', ' ').replace('ø', ' ')
    value = unicodedata.normalize('NFKD', source)
    value = value.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^A-Z0-9]+', '_', value.upper()).strip('_')


def _open_excel(file_path: Path):
    try:
        zf = zipfile.ZipFile(file_path)
        wb = zf.read('xl/workbook.xml')
        rels_xml = zf.read('xl/_rels/workbook.xml.rels')
    except (zipfile.BadZipFile, KeyError) as exc:
        raise PreviewError('File Excel khong hop le hoac khong phai dinh dang .xlsx') from exc

    from xml.etree import ElementTree as ET

    wb_root = ET.fromstring(wb)
    rels = ET.fromstring(rels_xml)
    rel_targets = {}
    for rel in rels.findall('r:Relationship', NS_REL):
        tid = rel.attrib.get('Id', '')
        target = rel.attrib.get('Target', '').lstrip('/')
        if not target.startswith('xl/'):
            target = 'xl/' + target
        rel_targets[tid] = target

    sheets = []
    for sheet in wb_root.findall('x:sheets/x:sheet', NS):
        rid = sheet.attrib.get(
            '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id',
            '',
        )
        sheets.append((sheet.attrib.get('name', '?'), rel_targets.get(rid, '')))
    return zf, sheets


def _parse_rows(zf, target: str) -> dict[int, dict[int, str]]:
    from xml.etree import ElementTree as ET

    shared_strings = load_shared_strings(zf)
    root = ET.fromstring(zf.read(target))
    rows: dict[int, dict[int, str]] = {}
    for row in root.findall('x:sheetData/x:row', NS):
        row_number = int(row.attrib.get('r', '0') or 0)
        cells = {}
        for cell in row.findall('x:c', NS):
            ref = cell.attrib.get('r', '')
            match = re.fullmatch(r'([A-Z]+)([0-9]+)', ref.upper())
            if not match:
                continue
            cells[col_to_index(match.group(1))] = cell_text(cell, shared_strings).strip()
        if cells:
            rows[row_number] = cells
    return rows


def preview_excel_workbook(file_path: Path, file_name: str) -> dict:
    """Return raw workbook tables for visual comparison before import validation."""
    zf, sheets = _open_excel(file_path)
    sheet_payloads = []
    total_rows = 0
    max_columns = 0

    try:
        for sheet_name, target in sheets:
            rows = _parse_rows(zf, target)
            max_col = max((max(row.keys()) for row in rows.values() if row), default=0)
            max_columns = max(max_columns, max_col)
            total_rows += len(rows)

            columns = [
                {
                    'index': index,
                    'key': index_to_col_letters(index),
                    'label': index_to_col_letters(index),
                }
                for index in range(1, max_col + 1)
            ]
            raw_rows = [
                {
                    'row_number': row_number,
                    'values': [row.get(index, '') for index in range(1, max_col + 1)],
                }
                for row_number, row in sorted(rows.items())
            ]

            sheet_payloads.append({
                'sheet_name': sheet_name,
                'row_count': len(raw_rows),
                'column_count': max_col,
                'columns': columns,
                'rows': raw_rows,
            })
    finally:
        zf.close()

    return {
        'file_name': file_name,
        'summary': {
            'sheet_count': len(sheet_payloads),
            'total_rows': total_rows,
            'max_columns': max_columns,
        },
        'sheets': sheet_payloads,
    }


def _column_value_index(column: dict) -> int | None:
    if 'valueIndex' in column:
        raw_index = column.get('valueIndex')
    elif 'value_index' in column:
        raw_index = column.get('value_index')
    else:
        raw_index = column.get('index')
        if raw_index is not None:
            try:
                return int(raw_index) - 1
            except (TypeError, ValueError):
                return None

    try:
        return int(raw_index)
    except (TypeError, ValueError):
        return None


def _is_ma_vt_header(normalized: str) -> bool:
    return normalized in MA_VT_HEADERS or normalized.endswith('_MA_VT') or 'MA_VT' in normalized


def _sync_field_for_header(normalized: str) -> tuple[str, str] | None:
    if normalized in SYNC_TEXT_FIELDS:
        return 'text', SYNC_TEXT_FIELDS[normalized]
    if normalized in SYNC_PRICE_FIELDS:
        return 'price', SYNC_PRICE_FIELDS[normalized]
    if normalized in SYNC_DECIMAL_FIELDS:
        return 'decimal', SYNC_DECIMAL_FIELDS[normalized]
    if normalized in SYNC_FK_FIELDS:
        return 'fk', SYNC_FK_FIELDS[normalized]
    return None


def _extract_sync_columns(columns: list[dict]) -> tuple[int | None, list[dict]]:
    ma_vt_index = None
    mappings = []
    for column in columns:
        if not isinstance(column, dict):
            continue
        label = str(column.get('label') or '').strip()
        value_index = _column_value_index(column)
        if not label or value_index is None or value_index < 0:
            continue

        normalized = _normalize(label)
        if _is_ma_vt_header(normalized):
            ma_vt_index = value_index
            continue

        field_info = _sync_field_for_header(normalized)
        if not field_info:
            continue
        kind, field_name = field_info
        mappings.append({
            'index': value_index,
            'label': label,
            'field': field_name,
            'kind': kind,
        })
    return ma_vt_index, mappings


def _row_value(values: list, index: int) -> str:
    if not isinstance(values, list) or index < 0 or index >= len(values):
        return ''
    return str(values[index] or '').strip()


def _is_field_missing(product: Product, field_name: str) -> bool:
    value = getattr(product, field_name, None)
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ''
    return False


def _is_fk_missing(product: Product, field_name: str) -> bool:
    related = getattr(product, field_name, None)
    if related is None:
        return True
    return _normalize(getattr(related, 'ten', '')) in {'', 'CHUA_RO'}


def _get_or_create_related(field_name: str, raw_value: str):
    value = raw_value.strip()
    if not value:
        return None

    model_map = {
        'hang_may': HangMay,
        'hang_sx': HangSx,
        'thuong_hieu': ThuongHieu,
    }
    model = model_map[field_name]
    slug = (slugify(value) or _normalize(value).lower() or 'khong-ro')[:100]

    obj = model.objects.filter(slug=slug).first()
    if obj:
        return obj
    obj = model.objects.filter(ten__iexact=value).first()
    if obj:
        return obj
    return model.objects.create(ten=value[:100], slug=slug)


def _apply_missing_field(product: Product, mapping: dict, raw_value: str) -> tuple[str | None, str | None]:
    if not raw_value:
        return None, None

    field_name = mapping['field']
    kind = mapping['kind']
    label = mapping['label']

    if kind == 'fk':
        if not _is_fk_missing(product, field_name):
            return None, None
        related = _get_or_create_related(field_name, raw_value)
        if not related:
            return None, None
        setattr(product, field_name, related)
        return field_name, None

    if not _is_field_missing(product, field_name):
        return None, None

    if kind == 'price':
        value = parse_price(raw_value)
        if value is None:
            return None, label
    elif kind == 'decimal':
        value = parse_decimal(raw_value)
        if value is None:
            return None, label
    else:
        value = raw_value.strip()

    setattr(product, field_name, value)
    return field_name, None


def sync_excel_missing_fields(rows: list[dict], columns: list[dict], sheet_name: str = '') -> dict:
    """Fill blank Product fields from preview rows, never overwrite existing values."""
    if not isinstance(rows, list):
        raise PreviewError('rows phai la danh sach')
    if not isinstance(columns, list):
        raise PreviewError('columns phai la danh sach')
    if len(rows) > 1:
        raise PreviewError('Chi duoc dong bo 1 dong moi lan')

    ma_vt_index, mappings = _extract_sync_columns(columns)
    if ma_vt_index is None:
        raise PreviewError('Khong tim thay cot MA VT trong sheet dang xem')
    if not mappings:
        raise PreviewError('Khong co cot nao khop field DB de dong bo')

    normalized_rows = []
    ma_vts = []
    seen_counts = {}
    for item in rows:
        if not isinstance(item, dict):
            continue
        values = item.get('values', [])
        ma_vt = _row_value(values, ma_vt_index)
        row_payload = {
            'row_number': item.get('row_number'),
            'ma_vt': ma_vt,
            'values': values if isinstance(values, list) else [],
        }
        normalized_rows.append(row_payload)
        if ma_vt:
            ma_vts.append(ma_vt)
            seen_counts[ma_vt] = seen_counts.get(ma_vt, 0) + 1

    products_by_code: dict[str, list[Product]] = {}
    if ma_vts:
        qs = (
            Product.objects
            .filter(ma_vt__in=set(ma_vts), is_active=True)
            .select_related('hang_may', 'hang_sx', 'thuong_hieu')
            .order_by('ma_vt', 'id')
        )
        for product in qs:
            products_by_code.setdefault(product.ma_vt, []).append(product)

    summary = {
        'total': len(normalized_rows),
        'updated': 0,
        'unchanged': 0,
        'skipped_new': 0,
        'skipped_missing_code': 0,
        'skipped_duplicate_excel': 0,
        'skipped_multiple_db': 0,
        'invalid': 0,
    }
    result_rows = []

    with transaction.atomic():
        for item in normalized_rows:
            row_number = item['row_number']
            ma_vt = item['ma_vt']
            values = item['values']
            updated_fields: list[str] = []
            invalid_fields: list[str] = []

            if not ma_vt:
                status_label = 'MISSING_CODE'
                db_count = 0
                summary['skipped_missing_code'] += 1
            elif seen_counts.get(ma_vt, 0) > 1:
                status_label = 'DUPLICATE_EXCEL'
                db_count = len(products_by_code.get(ma_vt, []))
                summary['skipped_duplicate_excel'] += 1
            else:
                products = products_by_code.get(ma_vt, [])
                db_count = len(products)
                if not products:
                    status_label = 'NEW'
                    summary['skipped_new'] += 1
                elif len(products) > 1:
                    status_label = 'MULTIPLE_DB'
                    summary['skipped_multiple_db'] += 1
                else:
                    product = products[0]
                    for mapping in mappings:
                        raw_value = _row_value(values, mapping['index'])
                        changed_field, invalid_field = _apply_missing_field(product, mapping, raw_value)
                        if changed_field:
                            updated_fields.append(changed_field)
                            if changed_field == 'model_turbo' and _is_field_missing(product, 'ten_hang'):
                                product.ten_hang = getattr(product, 'model_turbo', '')
                                updated_fields.append('ten_hang')
                        if invalid_field:
                            invalid_fields.append(invalid_field)

                    if sheet_name and _is_field_missing(product, 'sheet_name'):
                        product.sheet_name = sheet_name[:50]
                        updated_fields.append('sheet_name')

                    updated_fields = sorted(set(updated_fields))
                    if updated_fields:
                        product.save(update_fields=updated_fields + ['updated_at'])
                        status_label = 'UPDATED'
                        summary['updated'] += 1
                    else:
                        status_label = 'UNCHANGED'
                        summary['unchanged'] += 1

                    if invalid_fields:
                        summary['invalid'] += 1

            result_rows.append({
                'row_number': row_number,
                'ma_vt': ma_vt,
                'status': status_label,
                'db_count': db_count,
                'updated_fields': updated_fields,
                'invalid_fields': invalid_fields,
            })

    return {
        'summary': summary,
        'mapped_fields': [
            {'label': mapping['label'], 'field': mapping['field']}
            for mapping in mappings
        ],
        'rows': result_rows,
    }


def _has_any_value(row: dict[int, str], columns: Iterable[int]) -> bool:
    return any((row.get(col, '') or '').strip() for col in columns if col)


def _looks_like_section_header(*values: str) -> bool:
    normalized = _normalize(' '.join(value for value in values if value))
    return 'SAN_PHAM' in normalized or normalized.startswith(('NHOM_', 'HANG_'))


def _is_price_text_invalid(raw_value: str) -> bool:
    raw_value = (raw_value or '').strip()
    if not raw_value:
        return False
    normalized = _normalize(raw_value)
    if 'LIEN_HE' in normalized or normalized in {'-', '_'}:
        return False
    return parse_price(raw_value) is None


def _is_decimal_text_invalid(raw_value: str) -> bool:
    raw_value = (raw_value or '').strip()
    if not raw_value:
        return False
    try:
        Decimal(raw_value.replace(',', '.'))
        return False
    except InvalidOperation:
        return parse_decimal(raw_value) is None


def _validate_candidate(
    candidate: PreviewCandidate,
    price_values: dict[str, str] | None = None,
    decimal_values: dict[str, str] | None = None,
) -> None:
    if not candidate.ma_vt:
        candidate.errors.append('Thieu ma VT')
    elif len(candidate.ma_vt) > 100:
        candidate.errors.append('Ma VT dai hon 100 ky tu')

    if not candidate.hang_may:
        candidate.warnings.append('Hang may dang trong, khi import se gan CHUA RO neu importer ho tro')

    if not candidate.ten_hang:
        candidate.warnings.append('Ten hang/model dang trong')

    for field, raw_value in (price_values or {}).items():
        if _is_price_text_invalid(raw_value):
            candidate.errors.append(f'{PRICE_FIELDS.get(field, field)} khong phai so hop le')

    for label, raw_value in (decimal_values or {}).items():
        if _is_decimal_text_invalid(raw_value):
            candidate.warnings.append(f'{label} khong phai so thap phan hop le')


def _annotate_actions(candidates: list[PreviewCandidate]) -> None:
    valid_keys = {(item.ma_vt, item.loai) for item in candidates if item.ma_vt and not item.errors}
    existing_pairs: set[tuple[str, str]] = set()
    if valid_keys:
        ma_vts = {ma_vt for ma_vt, _ in valid_keys}
        existing_pairs = set(
            Product.objects.filter(ma_vt__in=ma_vts).values_list('ma_vt', 'loai')
        )

    seen: set[tuple[str, str]] = set()
    for item in candidates:
        key = (item.ma_vt, item.loai)
        if item.errors:
            item.action = 'ERROR'
        elif key in seen:
            item.action = 'ERROR'
            item.errors.append('Trung ma VT + loai trong chinh file upload')
        elif key in existing_pairs:
            item.action = 'UPDATE'
        else:
            item.action = 'CREATE'
        if item.ma_vt:
            seen.add(key)


def _candidate_to_dict(item: PreviewCandidate) -> dict:
    return {
        'sheet_name': item.sheet_name,
        'row_number': item.row_number,
        'ma_vt': item.ma_vt,
        'loai': item.loai,
        'ten_hang': item.ten_hang,
        'hang_may': item.hang_may,
        'action': item.action,
        'errors': item.errors,
        'warnings': item.warnings,
    }


def _new_sheet_summary(sheet_name: str) -> dict:
    return {
        'sheet_name': sheet_name,
        'previewed_rows': 0,
        'valid_rows': 0,
        'create_count': 0,
        'update_count': 0,
        'error_count': 0,
        'warning_count': 0,
        'error_summary': {},
    }


def _build_sheet_summaries(candidates: list[PreviewCandidate], sheets: list[str]) -> list[dict]:
    summaries = {sheet: _new_sheet_summary(sheet) for sheet in sheets}

    for item in candidates:
        summary = summaries.setdefault(item.sheet_name, _new_sheet_summary(item.sheet_name))
        summary['previewed_rows'] += 1
        summary['warning_count'] += len(item.warnings)

        if item.action == 'CREATE':
            summary['create_count'] += 1
            summary['valid_rows'] += 1
        elif item.action == 'UPDATE':
            summary['update_count'] += 1
            summary['valid_rows'] += 1
        elif item.action == 'ERROR':
            summary['error_count'] += 1

        for error in item.errors:
            summary['error_summary'][error] = summary['error_summary'].get(error, 0) + 1

    return [summary for summary in summaries.values() if summary['previewed_rows'] > 0]


def _build_response(
    *,
    file_name: str,
    importer_key: str,
    importer_label: str,
    candidates: list[PreviewCandidate],
    skipped_rows: int,
    sheets: list[str],
) -> dict:
    _annotate_actions(candidates)

    create_count = sum(1 for item in candidates if item.action == 'CREATE')
    update_count = sum(1 for item in candidates if item.action == 'UPDATE')
    error_count = sum(1 for item in candidates if item.action == 'ERROR')
    warning_count = sum(len(item.warnings) for item in candidates)
    error_summary: dict[str, int] = {}
    for item in candidates:
        for error in item.errors:
            error_summary[error] = error_summary.get(error, 0) + 1
    valid_count = create_count + update_count
    rows = [_candidate_to_dict(item) for item in candidates[:MAX_PREVIEW_ROWS]]
    sheet_summaries = _build_sheet_summaries(candidates, sheets)

    return {
        'file_name': file_name,
        'importer': importer_key,
        'importer_label': importer_label,
        'sheets': sheets,
        'sheet_summaries': sheet_summaries,
        'summary': {
            'total_rows': len(candidates) + skipped_rows,
            'previewed_rows': len(candidates),
            'valid_rows': valid_count,
            'create_count': create_count,
            'update_count': update_count,
            'error_count': error_count,
            'warning_count': warning_count,
            'skipped_rows': skipped_rows,
            'can_commit': valid_count > 0 and error_count == 0,
            'truncated': len(candidates) > MAX_PREVIEW_ROWS,
            'max_preview_rows': MAX_PREVIEW_ROWS,
            'error_summary': error_summary,
        },
        'rows': rows,
    }


def _preview_turbo(
    file_path: Path,
    file_name: str,
    *,
    importer_key: str,
    importer_label: str,
    v13_prices: bool,
) -> dict:
    candidates: list[PreviewCandidate] = []
    skipped_rows = 0

    zf, sheets = _open_excel(file_path)
    try:
        for sheet_idx in [2, 3]:
            if sheet_idx >= len(sheets):
                continue
            sheet_name, target = sheets[sheet_idx]
            norm_sheet = _normalize(sheet_name)
            loai = 'ruot' if 'RUOT' in norm_sheet else 'turbo'
            rows = _parse_rows(zf, target)

            for row_number in sorted(rows):
                if row_number <= 3:
                    continue
                row = rows[row_number]
                ma_vt = row.get(2, '').strip()
                hang_may = row.get(1, '').strip()
                row_label = _normalize(hang_may)
                if not ma_vt:
                    if _has_any_value(row, [3, 4, 5, 6, 7, 8, 9, 10]):
                        candidate = PreviewCandidate(sheet_name, row_number, '', loai)
                        candidate.errors.append('Thieu ma VT')
                        candidates.append(candidate)
                    else:
                        skipped_rows += 1
                    continue
                if 'LOAI' in row_label:
                    skipped_rows += 1
                    continue

                if v13_prices:
                    price_columns = {
                        'gia_dai_ly': row.get(11, ''),
                        'gia_uu_dai': row.get(12, ''),
                        'gia_vip': row.get(13, ''),
                        'gia_dl_10': row.get(14, ''),
                    }
                    decimal_columns = {
                        'CG duoi': row.get(15, ''),
                        'CG dinh': row.get(16, ''),
                        'CL duoi': row.get(18, ''),
                        'CL dinh': row.get(19, ''),
                    }
                    ten_hang = row.get(4, '').strip()
                else:
                    col_offset = 0 if loai == 'turbo' else -2
                    price_start = 11 + col_offset
                    price_columns = {
                        'gia_vip': row.get(price_start, ''),
                        'gia_uu_dai': row.get(price_start + 1, ''),
                        'gia_dai_ly': row.get(price_start + 2, ''),
                        'gia_dl_10': row.get(price_start + 3, ''),
                    }
                    decimal_columns = {
                        'CG duoi': row.get(15 + col_offset, ''),
                        'CG dinh': row.get(16 + col_offset, ''),
                        'CL duoi': row.get(18 + col_offset, ''),
                        'CL dinh': row.get(19 + col_offset, ''),
                    }
                    ten_hang = row.get(4, '').strip()

                candidate = PreviewCandidate(
                    sheet_name=sheet_name,
                    row_number=row_number,
                    ma_vt=ma_vt,
                    loai=loai,
                    ten_hang=ten_hang,
                    hang_may=hang_may,
                )
                _validate_candidate(candidate, price_columns, decimal_columns)
                candidates.append(candidate)
    finally:
        zf.close()

    return _build_response(
        file_name=file_name,
        importer_key=importer_key,
        importer_label=importer_label,
        candidates=candidates,
        skipped_rows=skipped_rows,
        sheets=[name for name, _ in sheets],
    )


def _preview_bo_hoi(file_path: Path, file_name: str) -> dict:
    candidates: list[PreviewCandidate] = []
    skipped_rows = 0

    zf, sheets = _open_excel(file_path)
    try:
        for sheet_name, target in sheets:
            loai, _cat_slug, _cat_ten, _cat_order = detect_sheet_category(sheet_name)
            if not loai or loai.startswith('_skip'):
                skipped_rows += len(_parse_rows(zf, target))
                continue

            col_map = BO_HOI_SHEET_COL_MAP.get(loai, BO_HOI_STANDARD_13_COLS)
            rows = _parse_rows(zf, target)
            for row_number in sorted(rows):
                row = rows[row_number]
                ma_vt_col = col_map.get('ma_vt', 2)
                ten_hang_col = col_map.get('ten_hang', 3)
                hang_may_col = col_map.get('hang_may', 4)
                ma_vt = row.get(ma_vt_col, '').strip()
                ten_hang = row.get(ten_hang_col, '').strip()
                hang_may = row.get(hang_may_col, '').strip()

                if not ma_vt:
                    if _looks_like_section_header(ten_hang, hang_may):
                        skipped_rows += 1
                        continue
                    if _has_any_value(row, [ten_hang_col, hang_may_col, col_map.get('gia_vip', 0)]):
                        candidate = PreviewCandidate(sheet_name, row_number, '', loai, ten_hang, hang_may)
                        candidate.errors.append('Thieu ma VT')
                        candidates.append(candidate)
                    else:
                        skipped_rows += 1
                    continue

                header_tokens = {'STT', 'MA_VT', 'MA_HH', 'M_VT', 'M_HH'}
                if _normalize(ma_vt) in header_tokens:
                    skipped_rows += 1
                    continue
                if not ten_hang or _normalize(ten_hang).startswith(('LOAI', 'HANG')):
                    skipped_rows += 1
                    continue

                price_columns = {
                    field: row.get(col, '')
                    for field, col in {
                        'gia_von': col_map.get('gia_von'),
                        'gia_vip': col_map.get('gia_vip'),
                        'gia_uu_dai': col_map.get('gia_uu_dai'),
                        'gia_dai_ly': col_map.get('gia_dai_ly'),
                        'gia_gara': col_map.get('gia_gara'),
                    }.items()
                    if col
                }

                candidate = PreviewCandidate(sheet_name, row_number, ma_vt, loai, ten_hang, hang_may)
                _validate_candidate(candidate, price_columns)
                candidates.append(candidate)
    finally:
        zf.close()

    return _build_response(
        file_name=file_name,
        importer_key='bo_hoi_moi',
        importer_label='Bang gia bo hoi/phu tung',
        candidates=candidates,
        skipped_rows=skipped_rows,
        sheets=[name for name, _ in sheets],
    )


def _preview_tong_hop(file_path: Path, file_name: str) -> dict:
    candidates: list[PreviewCandidate] = []
    skipped_rows = 0

    zf, sheets = _open_excel(file_path)
    try:
        for sheet_name, target in sheets:
            info = match_tong_hop_sheet(sheet_name)
            rows = _parse_rows(zf, target)
            if not info:
                skipped_rows += len(rows)
                continue

            loai, _cat_slug, _cat_ten, _cat_order = info
            for row_number in sorted(rows):
                row = rows[row_number]
                ma_vt = row.get(1, '').strip()
                if not ma_vt:
                    if _has_any_value(row, [2, 3, 4, 5, 6, 7]):
                        candidate = PreviewCandidate(sheet_name, row_number, '', loai)
                        candidate.errors.append('Thieu ma VT')
                        candidates.append(candidate)
                    else:
                        skipped_rows += 1
                    continue

                if not ma_vt.upper().startswith('HH'):
                    skipped_rows += 1
                    continue

                hang_may = row.get(2, '').strip()
                ten_hang = row.get(3, '').strip()
                if hang_may and hang_may not in ten_hang:
                    ten_hang = f'{ten_hang} - {hang_may}'

                price_columns = {
                    'gia_dai_ly': row.get(5, ''),
                    'gia_uu_dai': row.get(6, ''),
                    'gia_vip': row.get(7, ''),
                }
                candidate = PreviewCandidate(sheet_name, row_number, ma_vt, loai, ten_hang, hang_may)
                _validate_candidate(candidate, price_columns)
                candidates.append(candidate)
    finally:
        zf.close()

    return _build_response(
        file_name=file_name,
        importer_key='tong_hop_phu_tung',
        importer_label='Tong hop phu tung',
        candidates=candidates,
        skipped_rows=skipped_rows,
        sheets=[name for name, _ in sheets],
    )


@dataclass(frozen=True)
class ImporterSpec:
    key: str
    label: str
    matcher: Callable[[str, list[str]], bool]
    previewer: Callable[[Path, str], dict]
    importer_factory: Callable[[], object]


def _match_filename_or_sheet(needles: list[str], filename: str, sheets: list[str]) -> bool:
    haystack = ' '.join([_normalize(filename), *(_normalize(s) for s in sheets)])
    return all(_normalize(needle) in haystack for needle in needles)


IMPORTER_SPECS = [
    ImporterSpec(
        key='turbo_v13_gia',
        label='Turbo v13 co gia',
        matcher=lambda filename, sheets: _match_filename_or_sheet(['TURBO', 'V13'], filename, sheets),
        previewer=lambda path, filename: _preview_turbo(
            path,
            filename,
            importer_key='turbo_v13_gia',
            importer_label='Turbo v13 co gia',
            v13_prices=True,
        ),
        importer_factory=lambda: TurboV13GiaImporter(dry_run=False, overwrite_prices=True, batch_size=500),
    ),
    ImporterSpec(
        key='turbo_claude',
        label='Turbo Claude fallback',
        matcher=lambda filename, sheets: _match_filename_or_sheet(['TURBO', 'CLAUDE'], filename, sheets),
        previewer=lambda path, filename: _preview_turbo(
            path,
            filename,
            importer_key='turbo_claude',
            importer_label='Turbo Claude fallback',
            v13_prices=False,
        ),
        importer_factory=lambda: TurboClaudeImporter(dry_run=False, overwrite_prices=False, batch_size=500),
    ),
    ImporterSpec(
        key='tong_hop_phu_tung',
        label='Tong hop phu tung',
        matcher=lambda filename, sheets: (
            _match_filename_or_sheet(['TONG_HOP'], filename, sheets)
            or (
                not _match_filename_or_sheet(['BO_HOI'], filename, sheets)
                and any(match_tong_hop_sheet(sheet) for sheet in sheets)
            )
        ),
        previewer=_preview_tong_hop,
        importer_factory=lambda: TongHopPhuTungImporter(dry_run=False, overwrite_prices=False, batch_size=500),
    ),
    ImporterSpec(
        key='bo_hoi_moi',
        label='Bang gia bo hoi/phu tung',
        matcher=lambda filename, sheets: (
            not _match_filename_or_sheet(['TONG_HOP'], filename, sheets)
            and (
                _match_filename_or_sheet(['BO_HOI'], filename, sheets)
                or any(detect_sheet_category(sheet)[0] for sheet in sheets)
            )
        ),
        previewer=_preview_bo_hoi,
        importer_factory=lambda: BoHoiMoiImporter(dry_run=False, overwrite_prices=False, batch_size=500),
    ),
]


def _detect_importer(file_path: Path, file_name: str) -> ImporterSpec:
    zf, sheets = _open_excel(file_path)
    try:
        sheet_names = [name for name, _ in sheets]
    finally:
        zf.close()

    for spec in IMPORTER_SPECS:
        if spec.matcher(file_name, sheet_names):
            return spec
    raise PreviewError('Chua nhan dien duoc mau Excel nay')


def preview_excel_import(file_path: Path, file_name: str) -> dict:
    spec = _detect_importer(file_path, file_name)
    return spec.previewer(file_path, file_name)


def commit_excel_import(file_path: Path, file_name: str) -> dict:
    preview = preview_excel_import(file_path, file_name)
    if not preview['summary']['can_commit']:
        raise PreviewError('File con loi, vui long sua Excel roi preview lai truoc khi import')

    spec = next(item for item in IMPORTER_SPECS if item.key == preview['importer'])
    importer = spec.importer_factory()

    try:
        with transaction.atomic():
            result: ImportResult = importer.import_file(file_path)
            ImportLog.objects.create(
                file_name=file_name,
                status=result.status,
                products_created=result.created,
                products_updated=result.updated,
                errors=result.errors,
            )
    except Exception as exc:
        ImportLog.objects.create(
            file_name=file_name,
            status='FAILED',
            errors=[str(exc)],
        )
        raise

    return {
        'success': True,
        'file_name': file_name,
        'importer': spec.key,
        'importer_label': spec.label,
        'created': result.created,
        'updated': result.updated,
        'skipped': result.skipped,
        'errors': result.errors,
        'status': result.status,
    }
