"""Preview and commit product image matches from the local media repository."""
from __future__ import annotations

import hashlib
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from django.conf import settings
from django.db import transaction

from products.models import Product


IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
VIDEO_EXTENSIONS = {'.mp4'}
MEDIA_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS
PRODUCT_IMAGE_ROOTS = [
    {
        'key': 'ruot',
        'label': 'Kho hình ảnh ruột',
        'folder': 'KHO HÌNH ẢNH RUỘT',
        'expected_loai': 'ruot',
    },
    {
        'key': 'turbo',
        'label': 'Kho hình ảnh turbo',
        'folder': 'KHO HÌNH ẢNH TURBO',
        'expected_loai': 'turbo',
    },
]


class ImageImportError(Exception):
    """Raised when an image import request is invalid."""


@dataclass(frozen=True)
class ProductHit:
    product: Product
    method: str
    token: str
    confidence: int


def _media_root() -> Path:
    return Path(settings.MEDIA_ROOT).resolve()


def _products_root() -> Path:
    return (_media_root() / 'products').resolve()


def _clean_token(text: str) -> str:
    value = Path(str(text or '')).stem
    value = re.sub(r'\s*\(\d+\)\s*$', '', value)
    value = re.sub(r'_(\d+)$', '', value)
    value = re.sub(r'^(part\s*no\.?\s*)', '', value, flags=re.IGNORECASE)
    value = re.sub(r'[^A-Za-z0-9]+', '', value).upper()
    return value


def _token_candidates(text: str) -> list[str]:
    source = str(text or '').upper()
    values = [
        _clean_token(source),
        *re.findall(r'HH\d{4,6}', source),
        *re.findall(r'\b\d{5,6}-\d{4,6}\b', source),
        *re.findall(r'\b[A-Z]{1,5}\d{2,6}[A-Z0-9-]{0,8}\b', source),
        *re.findall(r'\b\d{6,8}\b', source),
    ]
    cleaned = []
    for value in values:
        token = _clean_token(value)
        if token and len(token) >= 4 and token not in cleaned:
            cleaned.append(token)
    return cleaned


def _path_candidates(path: Path, root: Path) -> list[str]:
    relative_parts = path.relative_to(root).parts
    values = []
    for part in relative_parts:
        values.extend(_token_candidates(part))
    return list(dict.fromkeys(values))


def _extract_product_tokens(value: str) -> list[str]:
    tokens = []
    for chunk in re.split(r'[\n,;/|]+', str(value or '')):
        tokens.extend(_token_candidates(chunk))
    return list(dict.fromkeys(tokens))


def _build_product_indexes():
    products = (
        Product.objects
        .filter(is_active=True)
        .select_related('category', 'hang_may', 'hang_sx', 'thuong_hieu')
        .only(
            'id', 'ma_vt', 'loai', 'ten_hang', 'model_turbo', 'ma_dong_co',
            'oem_part_no', 'parno', 'hinh_anh', 'danh_sach_hinh_anh', 'category__ten',
            'hang_may__ten', 'hang_sx__ten', 'thuong_hieu__ten',
        )
    )
    ma_vt_index: dict[str, list[Product]] = defaultdict(list)
    oem_index: dict[str, list[Product]] = defaultdict(list)

    for product in products:
        ma_token = _clean_token(product.ma_vt)
        if ma_token:
            ma_vt_index[ma_token].append(product)

        for token in _extract_product_tokens(product.oem_part_no):
            oem_index[token].append(product)
        for token in _extract_product_tokens(product.parno):
            oem_index[token].append(product)

    return ma_vt_index, oem_index


def _relative_media_path(path: Path) -> str:
    return path.resolve().relative_to(_media_root()).as_posix()


def _media_url(path: Path) -> str:
    return f'{settings.MEDIA_URL.rstrip("/")}/{_relative_media_path(path)}'


def _row_id(path: Path) -> str:
    rel = _relative_media_path(path)
    return hashlib.sha1(rel.encode('utf-8')).hexdigest()[:16]


def _file_kind(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in IMAGE_EXTENSIONS:
        return 'image'
    if ext in VIDEO_EXTENSIONS:
        return 'video'
    return 'unsupported'


def _product_payload(hit: ProductHit, expected_loai: str) -> dict:
    product = hit.product
    return {
        'id': product.id,
        'ma_vt': product.ma_vt,
        'loai': product.loai,
        'ten_hang': product.ten_hang or product.model_turbo or '',
        'model_turbo': product.model_turbo,
        'ma_dong_co': product.ma_dong_co,
        'oem_part_no': product.oem_part_no,
        'parno': product.parno,
        'hinh_anh': product.hinh_anh,
        'danh_sach_hinh_anh': product.danh_sach_hinh_anh or [],
        'category_name': product.category.ten if product.category else '',
        'hang_may_name': product.hang_may.ten if product.hang_may else '',
        'hang_sx_name': product.hang_sx.ten if product.hang_sx else '',
        'thuong_hieu_name': product.thuong_hieu.ten if product.thuong_hieu else '',
        'match_method': hit.method,
        'matched_token': hit.token,
        'confidence': hit.confidence,
        'has_image': bool((product.hinh_anh or '').strip()),
        'loai_mismatch': bool(expected_loai and product.loai != expected_loai),
    }


def _dedupe_hits(hits: Iterable[ProductHit]) -> list[ProductHit]:
    best: dict[int, ProductHit] = {}
    for hit in hits:
        current = best.get(hit.product.id)
        if not current or hit.confidence > current.confidence:
            best[hit.product.id] = hit
    return sorted(best.values(), key=lambda item: (-item.confidence, item.product.ma_vt, item.product.id))


def _find_hits(path: Path, root: Path, ma_vt_index: dict, oem_index: dict) -> tuple[list[ProductHit], list[str]]:
    candidates = _path_candidates(path, root)
    hits: list[ProductHit] = []

    for token in candidates:
        for product in ma_vt_index.get(token, []):
            hits.append(ProductHit(product=product, method='MA_VT', token=token, confidence=100))
        for product in oem_index.get(token, []):
            hits.append(ProductHit(product=product, method='OEM_PART_NO', token=token, confidence=82))

    return _dedupe_hits(hits), candidates


def _row_status(media_type: str, matches: list[dict], media_url: str) -> tuple[str, bool]:
    if media_type != 'image':
        return 'UNSUPPORTED', False
    if not matches:
        return 'UNMATCHED', False
    if len(matches) > 1:
        return 'MULTIPLE_MATCH', False

    match = matches[0]
    if match['loai_mismatch']:
        return 'LOAI_MISMATCH', False

    danh_sach = match.get('danh_sach_hinh_anh') or []
    is_already_imported = (media_url in danh_sach) or (match.get('hinh_anh') == media_url)
    if is_already_imported:
        return 'HAS_IMAGE', False

    if len(media_url) > 500:
        return 'URL_TOO_LONG', False
    return 'SAFE', True


def _scan_rows() -> tuple[list[dict], dict]:
    ma_vt_index, oem_index = _build_product_indexes()
    rows = []
    summary_counter = Counter()
    by_source = {}
    products_root = _products_root()

    for config in PRODUCT_IMAGE_ROOTS:
        root = products_root / config['folder']
        source_counter = Counter()
        if not root.exists():
            by_source[config['key']] = {
                'label': config['label'],
                'exists': False,
                'total_files': 0,
            }
            continue

        for path in sorted((item for item in root.rglob('*') if item.is_file()), key=lambda item: item.as_posix().lower()):
            media_path_lower = path.as_posix().lower()
            if 'chua phan loai' in media_path_lower or 'chưa phân loại' in media_path_lower:
                continue

            media_type = _file_kind(path)
            source_counter['total_files'] += 1
            summary_counter['total_files'] += 1

            if media_type == 'unsupported':
                source_counter['unsupported_files'] += 1
                summary_counter['unsupported_files'] += 1
                continue

            source_counter[f'{media_type}_files'] += 1
            summary_counter[f'{media_type}_files'] += 1
            summary_counter['media_files'] += 1

            hits, candidates = _find_hits(path, root, ma_vt_index, oem_index)
            matches = [_product_payload(hit, config['expected_loai']) for hit in hits]
            url = _media_url(path)
            status, safe_to_sync = _row_status(media_type, matches, url)

            source_counter[status.lower()] += 1
            summary_counter[status.lower()] += 1
            if matches:
                source_counter['matched_files'] += 1
                summary_counter['matched_files'] += 1
            else:
                source_counter['unmatched_files'] += 1
                summary_counter['unmatched_files'] += 1
            if safe_to_sync:
                source_counter['safe_to_sync'] += 1
                summary_counter['safe_to_sync'] += 1

            stat = path.stat()
            rows.append({
                'row_id': _row_id(path),
                'source_key': config['key'],
                'source_label': config['label'],
                'expected_loai': config['expected_loai'],
                'file_name': path.name,
                'relative_path': path.relative_to(root).as_posix(),
                'media_path': _relative_media_path(path),
                'media_url': url,
                'extension': path.suffix.lower(),
                'media_type': media_type,
                'size': stat.st_size,
                'modified_at': stat.st_mtime,
                'status': status,
                'safe_to_sync': safe_to_sync,
                'candidates': candidates[:12],
                'matches': matches,
                'match_count': len(matches),
            })

        by_source[config['key']] = {
            'label': config['label'],
            'exists': True,
            **dict(source_counter),
        }

    summary = {
        'total_files': summary_counter['total_files'],
        'media_files': summary_counter['media_files'],
        'image_files': summary_counter['image_files'],
        'video_files': summary_counter['video_files'],
        'unsupported_files': summary_counter['unsupported_files'],
        'matched_files': summary_counter['matched_files'],
        'unmatched_files': summary_counter['unmatched_files'],
        'multiple_match_files': summary_counter['multiple_match'],
        'has_image_files': summary_counter['has_image'],
        'loai_mismatch_files': summary_counter['loai_mismatch'],
        'safe_to_sync': summary_counter['safe_to_sync'],
        'url_too_long_files': summary_counter['url_too_long'],
        'by_source': by_source,
    }
    return rows, summary


def preview_product_image_import() -> dict:
    rows, summary = _scan_rows()
    return {
        'summary': summary,
        'rows': rows,
    }


def _rows_by_id() -> dict[str, dict]:
    rows, _summary = _scan_rows()
    return {row['row_id']: row for row in rows}


def commit_product_image_import(items: list[dict], overwrite: bool = False) -> dict:
    if not isinstance(items, list):
        raise ImageImportError('items phai la danh sach')
    if len(items) > 200:
        raise ImageImportError('Toi da 200 anh moi lan dong bo')

    row_lookup = _rows_by_id()
    product_ids = []
    normalized_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        row_id = str(item.get('row_id') or '')
        product_id = item.get('product_id')
        if not row_id or not product_id:
            continue
        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            continue
        normalized_items.append({'row_id': row_id, 'product_id': product_id})
        product_ids.append(product_id)

    products = {
        product.id: product
        for product in Product.objects.filter(id__in=product_ids, is_active=True)
    }
    results = []
    summary = Counter()

    with transaction.atomic():
        for item in normalized_items:
            row = row_lookup.get(item['row_id'])
            product = products.get(item['product_id'])
            summary['total'] += 1

            if not row:
                results.append({**item, 'status': 'SKIPPED', 'reason': 'Khong tim thay file trong kho'})
                summary['skipped'] += 1
                continue
            if row['media_type'] != 'image':
                results.append({**item, 'status': 'SKIPPED', 'reason': 'Chi dong bo file anh'})
                summary['skipped'] += 1
                continue
            if len(row['media_url']) > 500:
                results.append({**item, 'status': 'SKIPPED', 'reason': 'Duong dan anh dai hon 500 ky tu'})
                summary['skipped'] += 1
                continue
            if not product:
                results.append({**item, 'status': 'SKIPPED', 'reason': 'Khong tim thay san pham'})
                summary['skipped'] += 1
                continue

            match_ids = {match['id'] for match in row['matches']}
            if product.id not in match_ids:
                results.append({**item, 'status': 'SKIPPED', 'reason': 'Anh khong match san pham da chon'})
                summary['skipped'] += 1
                continue

            images = product.danh_sach_hinh_anh or []
            if not isinstance(images, list):
                images = [images] if images else []

            if row['media_url'] in images and not overwrite:
                results.append({**item, 'status': 'SKIPPED', 'reason': 'San pham da co anh nay'})
                summary['skipped'] += 1
                continue

            old_image = product.hinh_anh
            if row['media_url'] not in images:
                if overwrite or not product.hinh_anh:
                    images.insert(0, row['media_url'])
                    product.hinh_anh = row['media_url']
                else:
                    images.append(row['media_url'])
            elif overwrite:
                if row['media_url'] in images:
                    images.remove(row['media_url'])
                images.insert(0, row['media_url'])
                product.hinh_anh = row['media_url']

            product.danh_sach_hinh_anh = images
            product.save(update_fields=['hinh_anh', 'danh_sach_hinh_anh', 'updated_at'])
            results.append({
                **item,
                'status': 'UPDATED',
                'reason': '',
                'old_image': old_image,
                'new_image': row['media_url'],
                'ma_vt': product.ma_vt,
            })
            summary['updated'] += 1

    return {
        'summary': {
            'total': summary['total'],
            'updated': summary['updated'],
            'skipped': summary['skipped'],
        },
        'results': results,
    }
