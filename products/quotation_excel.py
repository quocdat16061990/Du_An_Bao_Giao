from copy import copy
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from pathlib import Path
import re

from django.conf import settings
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter, range_boundaries


TEMPLATE_PATH = Path(settings.BASE_DIR) / 'templates' / 'bao_gia_template_clean.xlsx'
PRODUCT_START_ROW = 11
PRODUCT_TEMPLATE_LAST_ROW = 18
TOTAL_ROW = 19


PRICE_LABELS = {
    'VIP': 'Gi\u00e1 VIP',
    'UU_DAI': 'Gi\u00e1 \u01b0u \u0111\u00e3i',
    '\u01afU_\u0110\u00c3I': 'Gi\u00e1 \u01b0u \u0111\u00e3i',
    'DAI_LY': 'Gi\u00e1 \u0111\u1ea1i l\u00fd',
    '\u0110\u1ea0I_L\u00dd': 'Gi\u00e1 \u0111\u1ea1i l\u00fd',
    'GARA': 'Gi\u00e1 gara',
    'NGOAI_LE': 'Gi\u00e1 DL+10%',
    'NGO\u1ea0I_L\u1ec6': 'Gi\u00e1 DL+10%',
}


def _shift_merged_ranges(ws, start_row: int, amount: int):
    shifted = []
    for merged_range in list(ws.merged_cells.ranges):
        min_col, min_row, max_col, max_row = range_boundaries(str(merged_range))
        if min_row >= start_row:
            ws.unmerge_cells(str(merged_range))
            shifted.append((min_col, min_row + amount, max_col, max_row + amount))

    for min_col, min_row, max_col, max_row in shifted:
        ws.merge_cells(
            f'{get_column_letter(min_col)}{min_row}:'
            f'{get_column_letter(max_col)}{max_row}'
        )


def _copy_row_style(ws, source_row: int, target_row: int):
    ws.row_dimensions[target_row].height = ws.row_dimensions[source_row].height
    for col in range(1, ws.max_column + 1):
        source = ws.cell(source_row, col)
        target = ws.cell(target_row, col)
        if source.has_style:
            target.font = copy(source.font)
            target.fill = copy(source.fill)
            target.border = copy(source.border)
            target.alignment = copy(source.alignment)
            target.number_format = source.number_format
            target.protection = copy(source.protection)


def _digits_to_words(number: int) -> str:
    names = [
        'kh\u00f4ng', 'm\u1ed9t', 'hai', 'ba', 'b\u1ed1n',
        'n\u0103m', 's\u00e1u', 'b\u1ea3y', 't\u00e1m', 'ch\u00edn',
    ]
    if number == 0:
        return 'kh\u00f4ng'

    def read_three(value: int, full: bool) -> str:
        hundred = value // 100
        ten = (value % 100) // 10
        unit = value % 10
        parts = []
        if full or hundred:
            parts.append(names[hundred])
            parts.append('tr\u0103m')
        if ten > 1:
            parts.append(names[ten])
            parts.append('m\u01b0\u01a1i')
            if unit == 1:
                parts.append('m\u1ed1t')
            elif unit == 5:
                parts.append('l\u0103m')
            elif unit:
                parts.append(names[unit])
        elif ten == 1:
            parts.append('m\u01b0\u1eddi')
            if unit == 5:
                parts.append('l\u0103m')
            elif unit:
                parts.append(names[unit])
        elif unit:
            if full or hundred:
                parts.append('l\u1ebb')
            parts.append('n\u0103m' if unit == 5 and (full or hundred) else names[unit])
        return ' '.join(parts)

    units = ['', 'ngh\u00ecn', 'tri\u1ec7u', 't\u1ef7']
    groups = []
    while number:
        groups.append(number % 1000)
        number //= 1000

    words = []
    for idx in range(len(groups) - 1, -1, -1):
        group = groups[idx]
        if group == 0:
            continue
        full = idx < len(groups) - 1
        words.append(read_three(group, full))
        if units[idx]:
            words.append(units[idx])
    return ' '.join(words)


def money_to_words(value: int) -> str:
    words = _digits_to_words(value).strip()
    if not words:
        words = 'kh\u00f4ng'
    return f'B\u1eb1ng ch\u1eef: {words[:1].upper()}{words[1:]} \u0111\u1ed3ng ch\u1eb5n./.'


def safe_excel_filename(customer_name: str) -> str:
    safe_name = re.sub(r'[\\/:*?"<>|]', '-', customer_name or 'khach_hang')
    safe_name = re.sub(r'\s+', '_', safe_name).strip('_')[:40] or 'khach_hang'
    return f"bao_gia_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"


def build_quotation_excel(customer, products_qs, quote_number: str) -> bytes:
    wb = load_workbook(TEMPLATE_PATH)
    ws = wb.active

    products = list(products_qs)
    extra_rows = max(0, len(products) - (PRODUCT_TEMPLATE_LAST_ROW - PRODUCT_START_ROW + 1))
    if extra_rows:
        _shift_merged_ranges(ws, TOTAL_ROW, extra_rows)
        ws.insert_rows(TOTAL_ROW, extra_rows)
        for row in range(TOTAL_ROW, TOTAL_ROW + extra_rows):
            _copy_row_style(ws, PRODUCT_TEMPLATE_LAST_ROW, row)

    total_row = TOTAL_ROW + extra_rows
    word_row = total_row + 1

    now = datetime.now()
    vat_rate = Decimal('0.08')
    gia_label = PRICE_LABELS.get(customer.phan_loai, 'Gi\u00e1 DL+10%')

    ws['C5'] = quote_number
    ws['H5'] = now.date()
    ws['J5'] = float(vat_rate)
    ws['C6'] = customer.ten_kh
    ws['H6'] = customer.dien_thoai or ''
    ws['C7'] = customer.dia_chi or customer.tinh_tp or ''
    ws['H7'] = ''
    ws['C8'] = customer.nha_xe.ten_nha_xe if customer.nha_xe else ''
    ws['H8'] = ''
    ws['C9'] = gia_label

    total_qty = 0
    subtotal = Decimal('0')
    vat_total = Decimal('0')
    grand_total = Decimal('0')

    for index, product in enumerate(products, start=1):
        row = PRODUCT_START_ROW + index - 1
        qty = 1
        unit_price = product.get_price_for_type(customer.phan_loai) or Decimal('0')
        line_subtotal = unit_price * qty
        line_vat = line_subtotal * vat_rate
        line_total = line_subtotal + line_vat

        total_qty += qty
        subtotal += line_subtotal
        vat_total += line_vat
        grand_total += line_total

        ws.cell(row, 2).value = index
        ws.cell(row, 3).value = product.ma_vt
        ws.cell(row, 4).value = product.ten_hang or product.model_turbo or ''
        ws.cell(row, 5).value = product.dvt or 'C\u00e1i'
        ws.cell(row, 6).value = qty
        ws.cell(row, 7).value = int(unit_price)
        ws.cell(row, 8).value = int(line_subtotal)
        ws.cell(row, 9).value = int(line_vat)
        ws.cell(row, 10).value = int(line_total)
        ws.cell(row, 11).value = gia_label

    for row in range(PRODUCT_START_ROW + len(products), total_row):
        ws.cell(row, 2).value = row - PRODUCT_START_ROW + 1
        for col in range(3, 11):
            ws.cell(row, col).value = None

    ws.cell(total_row, 2).value = 'T\u1ed5ng c\u1ed9ng'
    ws.cell(total_row, 6).value = total_qty
    ws.cell(total_row, 8).value = int(subtotal)
    ws.cell(total_row, 9).value = int(vat_total)
    ws.cell(total_row, 10).value = int(grand_total)
    ws.cell(word_row, 2).value = money_to_words(int(grand_total))

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()
