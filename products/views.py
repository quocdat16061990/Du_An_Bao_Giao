import logging
import re
import tempfile

from datetime import datetime
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.db.models import Q, Count, Min, Max, Case, When, Value, IntegerField
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import models, serializers, filters
from .pagination import FastPagination
from .pdf_converter import LibreOfficeNotFoundError, convert_excel_to_pdf
from .quotation_excel import build_quotation_excel, safe_excel_filename
from .services.excel_import_preview import (
    PreviewError,
    commit_excel_import,
    preview_excel_workbook,
    remove_temp_file,
    save_upload_to_temp,
    sync_excel_missing_fields,
)
from .services.image_import_preview import (
    ImageImportError,
    commit_product_image_import,
    preview_product_image_import,
)

logger = logging.getLogger('products')


# ═══════════ Products ═══════════
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = serializers.ProductListSerializer
    filterset_class = filters.ProductFilter
    pagination_class = FastPagination
    ordering_fields = ['ma_vt', 'model_turbo', 'ten_hang', 'created_at', 'gia_vip', 'gia_uu_dai', 'gia_dai_ly']
    ordering = ['ma_vt']

    def get_queryset(self):
        return (
            models.Product.objects
            .filter(is_active=True)
            .select_related('hang_may', 'hang_sx', 'thuong_hieu', 'category')
            .defer('oem_part_no')
            .annotate(
                image_priority=Case(
                    When(hinh_anh='', then=Value(1)),
                    When(hinh_anh__isnull=True, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
        )

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        active_ordering = list(queryset.query.order_by) or list(self.ordering)
        active_ordering = [
            field for field in active_ordering
            if str(field).lstrip('-') != 'image_priority'
        ]
        return queryset.order_by('image_priority', *active_ordering)


class ProductDetailView(generics.RetrieveAPIView):
    queryset = models.Product.objects.filter(is_active=True).select_related(
        'hang_may', 'hang_sx', 'thuong_hieu', 'category'
    )
    serializer_class = serializers.ProductDetailSerializer


class ProductStatsView(APIView):
    def get(self, request):
        qs = models.Product.objects.filter(is_active=True)
        last_import = models.ImportLog.objects.filter(status='SUCCESS').first()

        return Response({
            'totalProducts': qs.count(),
            'totalActive': qs.filter(is_active=True).count(),
            'byLoai': {
                'turbo': qs.filter(loai='turbo').count(),
                'ruot': qs.filter(loai='ruot').count(),
            },
            'byCategory': list(
                qs.values('category__ten')
                .annotate(count=Count('id'))
                .order_by('-count')[:20]
            ),
            'byHangMay': list(
                qs.values('hang_may__ten')
                .annotate(count=Count('id'))
                .order_by('-count')[:15]
            ),
            'byThuongHieu': list(
                qs.values('thuong_hieu__ten')
                .annotate(count=Count('id'))
                .order_by('-count')[:15]
            ),
            'priceRange': {
                'min': qs.aggregate(m=Min('gia_vip'))['m'],
                'max': qs.aggregate(m=Max('gia_dl_10'))['m'],
            },
            'lastImport': last_import.created_at.isoformat() if last_import else None,
        })


# ═══════════ Danh mục ═══════════
class HangMayListView(generics.ListAPIView):
    queryset = models.HangMay.objects.all()
    serializer_class = serializers.HangMaySerializer
    pagination_class = None


class HangSxListView(generics.ListAPIView):
    queryset = models.HangSx.objects.all()
    serializer_class = serializers.HangSxSerializer
    pagination_class = None


class ThuongHieuListView(generics.ListAPIView):
    queryset = models.ThuongHieu.objects.all()
    serializer_class = serializers.ThuongHieuSerializer
    pagination_class = None


class CategoryListView(generics.ListAPIView):
    """Danh sách danh mục sản phẩm (có kèm product_count)."""
    serializer_class = serializers.CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return models.Category.objects.annotate(
            product_count=Count('products', filter=Q(products__is_active=True))
        ).order_by('order', 'ten')


# ═══════════ Import Excel ═══════════
class ExcelImportPreviewView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'Vui long chon file Excel'}, status=status.HTTP_400_BAD_REQUEST)

        temp_path = save_upload_to_temp(uploaded_file)
        try:
            payload = preview_excel_workbook(temp_path, uploaded_file.name)
            return Response(payload)
        except PreviewError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            remove_temp_file(temp_path)


class ExcelImportCommitView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'Vui long chon file Excel'}, status=status.HTTP_400_BAD_REQUEST)

        temp_path = save_upload_to_temp(uploaded_file)
        try:
            payload = commit_excel_import(temp_path, uploaded_file.name)
            return Response(payload, status=status.HTTP_201_CREATED)
        except PreviewError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Excel import failed')
            return Response(
                {'error': f'Import that bai: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            remove_temp_file(temp_path)


class ExcelImportCheckDbView(APIView):
    """Check Excel row codes against products in DB without writing anything."""

    def post(self, request):
        rows = request.data.get('rows', [])
        if not isinstance(rows, list):
            return Response({'error': 'rows phai la danh sach'}, status=status.HTTP_400_BAD_REQUEST)
        if len(rows) > 1:
            return Response({'error': 'Chi duoc check 1 dong moi lan'}, status=status.HTTP_400_BAD_REQUEST)

        normalized_rows = []
        ma_vts = []
        seen_counts = {}
        for item in rows:
            if not isinstance(item, dict):
                continue
            row_number = item.get('row_number')
            raw_ma_vt = item.get('ma_vt', '')
            ma_vt = str(raw_ma_vt or '').strip()
            normalized_rows.append({'row_number': row_number, 'ma_vt': ma_vt})
            if ma_vt:
                ma_vts.append(ma_vt)
                seen_counts[ma_vt] = seen_counts.get(ma_vt, 0) + 1

        products_by_code = {}
        if ma_vts:
            qs = (
                models.Product.objects
                .filter(ma_vt__in=set(ma_vts), is_active=True)
                .select_related('category', 'hang_may', 'hang_sx', 'thuong_hieu')
                .order_by('ma_vt', 'id')
            )
            for product in qs:
                products_by_code.setdefault(product.ma_vt, []).append(product)

        result_rows = []
        summary = {
            'total': len(normalized_rows),
            'exists': 0,
            'new': 0,
            'missing_code': 0,
            'duplicate_excel': 0,
            'multiple_db': 0,
        }

        for item in normalized_rows:
            ma_vt = item['ma_vt']
            row_number = item['row_number']

            if not ma_vt:
                status_label = 'MISSING_CODE'
                products_payload = []
                summary['missing_code'] += 1
            else:
                products = products_by_code.get(ma_vt, [])
                products_payload = [
                    {
                        'id': product.id,
                        'ma_vt': product.ma_vt,
                        'loai': product.loai,
                        'loai_display': product.get_loai_display(),
                        'ten_hang': product.ten_hang or product.model_turbo or '',
                        'dvt': product.dvt,
                        'doi_th_sx': product.doi_th_sx,
                        'parno': product.parno,
                        'model_turbo': product.model_turbo,
                        'ma_dong_co': product.ma_dong_co,
                        'oem_part_no': product.oem_part_no,
                        'dac_diem': product.dac_diem,
                        'ung_dung': product.ung_dung,
                        'hinh_anh': product.hinh_anh,
                        'ghi_chu': product.ghi_chu,
                        'gia_von': product.gia_von,
                        'gia_vip': product.gia_vip,
                        'gia_uu_dai': product.gia_uu_dai,
                        'gia_dai_ly': product.gia_dai_ly,
                        'gia_gara': product.gia_gara,
                        'gia_dl_10': product.gia_dl_10,
                        'cg_duoi': product.cg_duoi,
                        'cg_dinh': product.cg_dinh,
                        'cg_so': product.cg_so,
                        'cl_duoi': product.cl_duoi,
                        'cl_dinh': product.cl_dinh,
                        'cl_so': product.cl_so,
                        'sheet_name': product.sheet_name,
                        'created_at': product.created_at,
                        'updated_at': product.updated_at,
                        'category_name': product.category.ten if product.category else '',
                        'hang_may_name': product.hang_may.ten if product.hang_may else '',
                        'hang_sx_name': product.hang_sx.ten if product.hang_sx else '',
                        'thuong_hieu_name': product.thuong_hieu.ten if product.thuong_hieu else '',
                    }
                    for product in products
                ]

                if seen_counts.get(ma_vt, 0) > 1:
                    status_label = 'DUPLICATE_EXCEL'
                    summary['duplicate_excel'] += 1
                elif len(products) > 1:
                    status_label = 'MULTIPLE_DB'
                    summary['multiple_db'] += 1
                elif products:
                    status_label = 'EXISTS'
                    summary['exists'] += 1
                else:
                    status_label = 'NEW'
                    summary['new'] += 1

            result_rows.append({
                'row_number': row_number,
                'ma_vt': ma_vt,
                'status': status_label,
                'db_count': len(products_payload),
                'products': products_payload,
            })

        return Response({'summary': summary, 'rows': result_rows})


class ExcelImportSyncMissingView(APIView):
    """Fill missing DB fields from preview rows after an explicit user action."""

    def post(self, request):
        rows = request.data.get('rows', [])
        columns = request.data.get('columns', [])
        sheet_name = str(request.data.get('sheet_name') or '')

        try:
            payload = sync_excel_missing_fields(rows, columns, sheet_name)
            return Response(payload)
        except PreviewError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Excel sync missing fields failed')
            return Response(
                {'error': f'Dong bo that bai: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ═══════════ Import product images ═══════════
class ProductImageImportScanView(APIView):
    """Preview image files in media/products before writing hinh_anh."""

    def get(self, request):
        try:
            return Response(preview_product_image_import())
        except Exception as exc:
            logger.exception('Product image import scan failed')
            return Response(
                {'error': f'Scan kho anh that bai: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProductImageImportSyncView(APIView):
    """Write selected image matches to Product.hinh_anh."""

    def post(self, request):
        items = request.data.get('items', [])
        overwrite = bool(request.data.get('overwrite', False))
        try:
            return Response(commit_product_image_import(items, overwrite=overwrite))
        except ImageImportError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception('Product image import sync failed')
            return Response(
                {'error': f'Dong bo anh that bai: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ═══════════ Customers ═══════════
class CustomerListView(generics.ListCreateAPIView):
    queryset = models.Customer.objects.filter(is_active=True)
    serializer_class = serializers.CustomerSerializer


class CustomerSearchView(generics.ListAPIView):
    serializer_class = serializers.CustomerSearchSerializer
    pagination_class = None

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return models.Customer.objects.none()
        return models.Customer.objects.filter(
            Q(ten_kh__icontains=q) | Q(ma_kh__icontains=q) |
            Q(dien_thoai__icontains=q) | Q(dia_chi__icontains=q),
            is_active=True,
        ).order_by('ten_kh')[:12]


class CustomerDetailView(generics.RetrieveAPIView):
    queryset = models.Customer.objects.filter(is_active=True)
    serializer_class = serializers.CustomerSerializer


# ═══════════ Nhà xe ═══════════
class NhaXeListView(generics.ListAPIView):
    queryset = models.NhaXe.objects.all()
    serializer_class = serializers.NhaXeSerializer
    pagination_class = None


# ═══════════ Quotation ═══════════
QUOTATION_PRICE_LABELS = {
    'VIP': 'GIÁ VIP',
    'UU_DAI': 'GIÁ ƯU ĐÃI',
    'ƯU_ĐÃI': 'GIÁ ƯU ĐÃI',
    'DAI_LY': 'GIÁ ĐẠI LÝ',
    'ĐẠI_LÝ': 'GIÁ ĐẠI LÝ',
    'GARA': 'GIÁ GARA',
    'NGOAI_LE': 'GIÁ DL+10%',
    'NGOẠI_LỆ': 'GIÁ DL+10%',
}


def _generate_quote_number(now, product_count: int) -> str:
    base = f"BG{now.strftime('%Y%m%d%H%M%S')}-{product_count:02d}"
    if not models.Quotation.objects.filter(quote_number=base).exists():
        return base
    for suffix in range(2, 100):
        candidate = f'{base}-{suffix}'
        if not models.Quotation.objects.filter(quote_number=candidate).exists():
            return candidate
    return f"{base}-{now.strftime('%f')}"


def _safe_filename_part(value: str) -> str:
    safe = re.sub(r'[^A-Za-z0-9]+', '_', value or '').strip('_')
    return safe[:40] or 'khach_hang'


def _quotation_excel_filename(customer_name: str, quote_number: str) -> str:
    return f'{quote_number}_{_safe_filename_part(customer_name)}.xlsx'


def _quotation_excel_relative_path(now, filename: str) -> Path:
    return Path('exports') / 'quotations' / now.strftime('%Y') / now.strftime('%m') / now.strftime('%d') / filename


def _resolve_export_path(relative_path: Path | str) -> Path:
    export_root = (settings.BASE_DIR / 'exports').resolve()
    file_path = (settings.BASE_DIR / relative_path).resolve()
    if export_root != file_path and export_root not in file_path.parents:
        raise ValueError('Duong dan file khong hop le')
    return file_path


def _get_products_for_quote(product_ids):
    return list(
        models.Product.objects
        .filter(id__in=product_ids, is_active=True)
        .order_by('ma_vt')
    )


def _custom_prices_map_from_items(items_custom):
    if not items_custom:
        return None
    custom_prices_map = {}
    for item in items_custom:
        custom_prices_map[item['product_id']] = {
            'price': Decimal(str(item['custom_price'])),
            'label': item['price_label'],
        }
    return custom_prices_map


def _convert_excel_bytes_to_pdf(excel_bytes: bytes, quote_number: str) -> bytes:
    temp_root = settings.BASE_DIR / 'exports' / 'temp'
    temp_root.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(
        prefix='quote_pdf_',
        dir=temp_root,
        ignore_cleanup_errors=True,
    ) as work_dir:
        work_dir_path = Path(work_dir)
        excel_path = work_dir_path / f'{quote_number}.xlsx'
        excel_path.write_bytes(excel_bytes)
        pdf_path = convert_excel_to_pdf(excel_path, work_dir_path)
        return pdf_path.read_bytes()


def _create_quotation_record(
    *,
    customer,
    products,
    quote_number: str,
    now,
    nhan_vien: str = '',
    excel_file_name: str = '',
    excel_file_path: str = '',
    excel_file_size: int = 0,
    custom_prices_map=None,
):
    tong_cong = Decimal('0')
    products = list(products)

    with transaction.atomic():
        # Determine the price label applying globally (or default if custom)
        global_gia_ap_dung = QUOTATION_PRICE_LABELS.get(customer.phan_loai, 'GIÁ ĐL+10%')
        if custom_prices_map:
            global_gia_ap_dung = 'GIÁ LINH HOẠT'

        quotation = models.Quotation.objects.create(
            quote_number=quote_number,
            quote_date=now.date(),
            customer=customer,
            customer_name=customer.ten_kh,
            customer_phone=customer.dien_thoai or '',
            gia_ap_dung=global_gia_ap_dung,
            tong_cong=Decimal('0'),
            product_count=len(products),
            nhan_vien=nhan_vien,
            excel_file_name=excel_file_name,
            excel_file_path=excel_file_path,
            excel_file_size=excel_file_size,
            excel_created_at=now if excel_file_path else None,
        )

        for product in products:
            if custom_prices_map and product.id in custom_prices_map:
                don_gia = Decimal(str(custom_prices_map[product.id]['price']))
            else:
                don_gia = product.get_price_for_type(customer.phan_loai) or Decimal('0')
            thanh_tien = (don_gia * Decimal('1.08')).quantize(Decimal('1.'))
            tong_cong += thanh_tien
            models.QuotationItem.objects.create(
                quotation=quotation,
                product=product,
                ma_vt=product.ma_vt,
                ten_hang=product.ten_hang or product.model_turbo or '',
                don_gia=don_gia,
                so_luong=1,
                thanh_tien=thanh_tien,
            )

        quotation.tong_cong = tong_cong
        quotation.save(update_fields=['tong_cong'])

    return quotation


class _QuotationItemProductSnapshot:
    def __init__(self, item):
        self.ma_vt = item.ma_vt
        self.ten_hang = item.ten_hang
        self.model_turbo = ''
        self.dvt = item.product.dvt if item.product else 'Cai'
        self._price = item.don_gia or Decimal('0')

    def get_price_for_type(self, _phan_loai):
        return self._price


def _save_excel_file_for_quotation(quotation) -> Path | None:
    items = list(quotation.items.select_related('product').all())
    if not items:
        return None

    base_time = timezone.localtime(quotation.created_at) if quotation.created_at else timezone.localtime()
    filename = quotation.excel_file_name or _quotation_excel_filename(quotation.customer_name, quotation.quote_number)
    relative_path = Path(quotation.excel_file_path) if quotation.excel_file_path else _quotation_excel_relative_path(base_time, filename)
    absolute_path = _resolve_export_path(relative_path)
    excel_bytes = build_quotation_excel(
        quotation.customer,
        [_QuotationItemProductSnapshot(item) for item in items],
        quotation.quote_number,
    )

    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    absolute_path.write_bytes(excel_bytes)

    quotation.excel_file_name = filename
    quotation.excel_file_path = relative_path.as_posix()
    quotation.excel_file_size = len(excel_bytes)
    quotation.excel_created_at = timezone.localtime()
    quotation.save(update_fields=[
        'excel_file_name',
        'excel_file_path',
        'excel_file_size',
        'excel_created_at',
        'updated_at',
    ])
    return absolute_path


class QuotationPreviewView(APIView):
    def post(self, request):
        req_serializer = serializers.QuotationRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']

        try:
            customer = models.Customer.objects.get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Không tìm thấy khách hàng'}, status=404)

        products_qs = models.Product.objects.filter(
            id__in=product_ids, is_active=True
        ).order_by('ma_vt')

        products_data = []
        tong_cong = Decimal('0')
        for p in products_qs:
            don_gia = p.get_price_for_type(customer.phan_loai)
            thanh_tien = don_gia
            tong_cong += thanh_tien
            products_data.append({
                'id': p.id, 'ma_vt': p.ma_vt,
                'ten_hang': p.ten_hang or p.model_turbo or '',
                'model_turbo': p.model_turbo, 'ma_dong_co': p.ma_dong_co,
                'oem_part_no': p.oem_part_no, 'dac_diem': p.dac_diem,
                'ung_dung': p.ung_dung,
                'don_gia': int(don_gia), 'so_luong': 1,
                'thanh_tien': int(thanh_tien),
            })

        gia_labels = {
            'VIP': 'GIÁ VIP', 'ƯU_ĐÃI': 'GIÁ ƯU ĐÃI',
            'ĐẠI_LÝ': 'GIÁ ĐẠI LÝ', 'NGOẠI_LỆ': 'GIÁ ĐL+10%',
        }

        return Response({
            'quote_number': f"BG{datetime.now().strftime('%Y%m%d')}-{len(product_ids):02d}",
            'quote_date': datetime.now().strftime('%d/%m/%Y'),
            'customer': serializers.CustomerSerializer(customer).data,
            'gia_ap_dung': gia_labels.get(customer.phan_loai, 'GIÁ ĐL+10%'),
            'products': products_data,
            'tong_cong': int(tong_cong),
            'tong_chu': f'{int(tong_cong):,} VNĐ',
            'company': settings.COMPANY_CONFIG,
        })


class QuotationExportCSVView(APIView):
    def post(self, request):
        req_serializer = serializers.QuotationRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']

        try:
            customer = models.Customer.objects.get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Không tìm thấy khách hàng'}, status=404)

        products_qs = models.Product.objects.filter(
            id__in=product_ids, is_active=True
        ).order_by('ma_vt')

        import csv, io
        buf = io.StringIO()
        buf.write('﻿')
        writer = csv.writer(buf)
        writer.writerow(['STT', 'Mã VT', 'Model Turbo', 'Mã động cơ', 'OEM Part No',
                         'Đặc điểm', 'Ứng dụng', 'Đơn giá', 'SL', 'Thành tiền'])
        for i, p in enumerate(products_qs, 1):
            don_gia = p.get_price_for_type(customer.phan_loai)
            writer.writerow([i, p.ma_vt, p.model_turbo, p.ma_dong_co,
                             p.oem_part_no.split('/')[0].strip() if p.oem_part_no else '',
                             p.dac_diem, p.ung_dung, int(don_gia), 1, int(don_gia)])

        response = Response(buf.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="bao_gia_turbo.csv"'
        return response


class QuotationExportExcelView(APIView):
    def post(self, request):
        req_serializer = serializers.QuotationRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']
        nhan_vien = str(request.data.get('nhan_vien') or '')
        items_custom = req_serializer.validated_data.get('items_custom')

        custom_prices_map = None
        if items_custom:
            custom_prices_map = {}
            for item in items_custom:
                custom_prices_map[item['product_id']] = {
                    'price': Decimal(str(item['custom_price'])),
                    'label': item['price_label']
                }

        try:
            customer = models.Customer.objects.select_related('nha_xe').get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Khong tim thay khach hang'}, status=404)

        products = _get_products_for_quote(product_ids)
        if not products:
            return Response({'error': 'Khong tim thay san pham hop le'}, status=400)

        now = timezone.localtime()
        quote_number = _generate_quote_number(now, len(products))
        excel_bytes = build_quotation_excel(customer, products, quote_number, custom_prices_map=custom_prices_map)
        filename = _quotation_excel_filename(customer.ten_kh, quote_number)
        relative_path = _quotation_excel_relative_path(now, filename)
        absolute_path = _resolve_export_path(relative_path)
        absolute_path.parent.mkdir(parents=True, exist_ok=True)
        absolute_path.write_bytes(excel_bytes)

        quotation = _create_quotation_record(
            customer=customer,
            products=products,
            quote_number=quote_number,
            now=now,
            nhan_vien=nhan_vien,
            excel_file_name=filename,
            excel_file_path=relative_path.as_posix(),
            excel_file_size=len(excel_bytes),
            custom_prices_map=custom_prices_map,
        )

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Quotation-Id'] = str(quotation.id)
        response['X-Quote-Number'] = quotation.quote_number
        return response


# ═══════════ PDF Export ═══════════
class LegacyQuotationExportPDFView(APIView):
    def post(self, request):
        req_serializer = serializers.QuotationRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']

        try:
            customer = models.Customer.objects.get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Không tìm thấy khách hàng'}, status=404)

        products_qs = models.Product.objects.filter(
            id__in=product_ids, is_active=True
        ).order_by('ma_vt')

        # Build product data
        products_data = []
        tong_cong = Decimal('0')
        for p in products_qs:
            don_gia = p.get_price_for_type(customer.phan_loai)
            thanh_tien = don_gia
            tong_cong += thanh_tien
            products_data.append({
                'ma_vt': p.ma_vt,
                'model_turbo': p.model_turbo,
                'ma_dong_co': p.ma_dong_co,
                'oem_short': p.oem_part_no.split('/')[0].strip() if p.oem_part_no else '',
                'dac_diem': p.dac_diem,
                'don_gia_fmt': f'{int(don_gia):,} ₫' if don_gia else 'Liên hệ',
                'thanh_tien_fmt': f'{int(thanh_tien):,} ₫' if thanh_tien else '—',
            })

        gia_labels = {
            'VIP': 'GIÁ VIP', 'ƯU_ĐÃI': 'GIÁ ƯU ĐÃI',
            'ĐẠI_LÝ': 'GIÁ ĐẠI LÝ', 'NGOẠI_LỆ': 'GIÁ ĐL+10%',
        }

        from django.template.loader import render_to_string
        html = render_to_string('quotation_pdf.html', {
            'company': settings.COMPANY_CONFIG,
            'quote_number': f"BG{datetime.now().strftime('%Y%m%d')}-{len(product_ids):02d}",
            'quote_date': datetime.now().strftime('%d/%m/%Y'),
            'customer': {
                'ten_kh': customer.ten_kh,
                'dien_thoai': customer.dien_thoai,
                'dia_chi': customer.dia_chi,
                'tinh_tp': customer.tinh_tp,
                'phan_loai': customer.phan_loai,
                'nha_xe_name': customer.nha_xe.ten_nha_xe if customer.nha_xe else '',
            },
            'gia_label': gia_labels.get(customer.phan_loai, 'GIÁ ĐL+10%'),
            'products': products_data,
            'tong_cong_fmt': f'{int(tong_cong):,} ₫' if tong_cong else 'Liên hệ',
        })

        # Generate PDF
        import io
        from xhtml2pdf import pisa
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os as _os

        # Register Vietnamese-compatible font from Windows
        font_paths = [
            _os.path.join(_os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', 'arial.ttf'),
            _os.path.join(_os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', 'segoeui.ttf'),
            _os.path.join(_os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', 'times.ttf'),
        ]
        font_registered = False
        for fp in font_paths:
            if _os.path.isfile(fp):
                pdfmetrics.registerFont(TTFont('VietnameseFont', fp))
                font_registered = True
                break

        buf = io.BytesIO()
        pisa.CreatePDF(html, dest=buf, encoding='utf-8')
        pdf_bytes = buf.getvalue()

        # Save to exports folder
        import os
        from pathlib import Path
        export_dir = Path(settings.BASE_DIR) / 'exports'
        export_dir.mkdir(parents=True, exist_ok=True)
        import re
        safe_name = re.sub(r'[\\/:*?"<>|]', '-', customer.ten_kh)
        safe_name = safe_name.replace(' ', '_')
        filename = f"bao_gia_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = export_dir / filename
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)

        # Return as download
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Saved-Path'] = str(filepath)
        return response


# ═══════════ Quotation Save & History ═══════════

class QuotationPreviewPDFView(APIView):
    def post(self, request):
        req_serializer = serializers.QuotationRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']
        custom_prices_map = _custom_prices_map_from_items(
            req_serializer.validated_data.get('items_custom')
        )

        try:
            customer = models.Customer.objects.select_related('nha_xe').get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Khong tim thay khach hang'}, status=404)

        products = _get_products_for_quote(product_ids)
        if not products:
            return Response({'error': 'Khong tim thay san pham hop le'}, status=400)

        now = timezone.localtime()
        quote_number = f"PREVIEW{now.strftime('%Y%m%d%H%M%S')}-{len(products):02d}"
        excel_bytes = build_quotation_excel(customer, products, quote_number, custom_prices_map=custom_prices_map)

        try:
            pdf_bytes = _convert_excel_bytes_to_pdf(excel_bytes, quote_number)
        except LibreOfficeNotFoundError as exc:
            logger.warning('LibreOffice PDF preview conversion failed: %s', exc)
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.exception('PDF preview failed')
            return Response({'error': f'Khong the xem truoc PDF: {exc}'}, status=500)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="quotation-preview.pdf"'
        response['Cache-Control'] = 'no-store'
        return response


class QuotationExportPDFView(APIView):
    def post(self, request):
        req_serializer = serializers.QuotationRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']
        nhan_vien = str(request.data.get('nhan_vien') or '')
        items_custom = req_serializer.validated_data.get('items_custom')

        custom_prices_map = _custom_prices_map_from_items(items_custom)

        try:
            customer = models.Customer.objects.select_related('nha_xe').get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Khong tim thay khach hang'}, status=404)

        products = _get_products_for_quote(product_ids)
        if not products:
            return Response({'error': 'Khong tim thay san pham hop le'}, status=400)

        now = timezone.localtime()
        quote_number = _generate_quote_number(now, len(products))
        excel_bytes = build_quotation_excel(customer, products, quote_number, custom_prices_map=custom_prices_map)

        try:
            pdf_bytes = _convert_excel_bytes_to_pdf(excel_bytes, quote_number)
        except LibreOfficeNotFoundError as exc:
            logger.warning('LibreOffice PDF conversion failed: %s', exc)
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.exception('PDF export failed')
            return Response({'error': f'Khong the xuat PDF: {exc}'}, status=500)

        quotation = _create_quotation_record(
            customer=customer,
            products=products,
            quote_number=quote_number,
            now=now,
            nhan_vien=nhan_vien,
            custom_prices_map=custom_prices_map,
        )

        filename = f'{quote_number}_{_safe_filename_part(customer.ten_kh)}.pdf'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Quotation-Id'] = str(quotation.id)
        response['X-Quote-Number'] = quotation.quote_number
        return response


class QuotationSaveView(APIView):
    """Lưu báo giá đã gởi vào database."""

    def post(self, request):
        req_serializer = serializers.QuotationSaveSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        product_ids = req_serializer.validated_data['product_ids']
        customer_id = req_serializer.validated_data['customer_id']
        nhan_vien = req_serializer.validated_data.get('nhan_vien', '')
        items_custom = req_serializer.validated_data.get('items_custom')

        custom_prices_map = {}
        if items_custom:
            for item in items_custom:
                custom_prices_map[item['product_id']] = {
                    'price': Decimal(str(item['custom_price'])),
                    'label': item['price_label']
                }

        try:
            customer = models.Customer.objects.get(id=customer_id, is_active=True)
        except models.Customer.DoesNotExist:
            return Response({'error': 'Không tìm thấy khách hàng'}, status=404)

        products_qs = models.Product.objects.filter(
            id__in=product_ids, is_active=True
        ).order_by('ma_vt')

        gia_labels = {
            'VIP': 'GIÁ VIP', 'ƯU_ĐÃI': 'GIÁ ƯU ĐÃI',
            'ĐẠI_LÝ': 'GIÁ ĐẠI LÝ', 'NGOẠI_LỆ': 'GIÁ ĐL+10%',
        }

        now = datetime.now()
        tong_cong = Decimal('0')
        quote_number = f"BG{now.strftime('%Y%m%d%H%M%S')}-{len(product_ids):02d}"

        global_gia_ap_dung = gia_labels.get(customer.phan_loai, 'GIÁ ĐL+10%')
        if custom_prices_map:
            global_gia_ap_dung = 'GIÁ LINH HOẠT'

        quotation = models.Quotation.objects.create(
            quote_number=quote_number,
            quote_date=now.date(),
            customer=customer,
            customer_name=customer.ten_kh,
            customer_phone=customer.dien_thoai or '',
            gia_ap_dung=global_gia_ap_dung,
            tong_cong=Decimal('0'),
            product_count=len(product_ids),
            nhan_vien=nhan_vien,
        )

        for p in products_qs:
            if custom_prices_map and p.id in custom_prices_map:
                don_gia = custom_prices_map[p.id]['price']
            else:
                don_gia = p.get_price_for_type(customer.phan_loai) or Decimal('0')
            thanh_tien = (don_gia * Decimal('1.08')).quantize(Decimal('1.'))
            tong_cong += thanh_tien
            models.QuotationItem.objects.create(
                quotation=quotation,
                product=p,
                ma_vt=p.ma_vt,
                ten_hang=p.ten_hang or p.model_turbo or '',
                don_gia=don_gia,
                so_luong=1,
                thanh_tien=thanh_tien,
            )

        quotation.tong_cong = tong_cong
        quotation.save(update_fields=['tong_cong'])

        return Response({
            'success': True,
            'id': quotation.id,
            'quote_number': quotation.quote_number,
        }, status=status.HTTP_201_CREATED)


class QuotationUpdateItemsView(APIView):
    """Cap nhat don gia cac dong trong bao gia va xuat lai file Excel."""

    def post(self, request, pk):
        req_serializer = serializers.QuotationUpdateItemsSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)
        items_data = req_serializer.validated_data['items']

        try:
            quotation = models.Quotation.objects.get(pk=pk)
        except models.Quotation.DoesNotExist:
            return Response({'error': 'Khong tim thay bao gia'}, status=status.HTTP_404_NOT_FOUND)

        # Build lookup map for existing items by ma_vt
        existing_items = list(quotation.items.all())
        item_by_ma_vt = {item.ma_vt: item for item in existing_items}

        updated_items = []
        not_found = []
        unchanged_items = []

        for item_data in items_data:
            ma_vt = item_data['ma_vt']
            new_don_gia = item_data['don_gia']

            if ma_vt not in item_by_ma_vt:
                not_found.append(ma_vt)
                continue

            quotation_item = item_by_ma_vt[ma_vt]
            old_don_gia = quotation_item.don_gia

            if old_don_gia == new_don_gia:
                unchanged_items.append({
                    'ma_vt': ma_vt,
                    'ten_hang': quotation_item.ten_hang,
                    'don_gia': int(new_don_gia),
                    'thanh_tien': int(quotation_item.thanh_tien),
                })
                continue

            quotation_item.don_gia = new_don_gia
            quotation_item.thanh_tien = new_don_gia * quotation_item.so_luong
            quotation_item.save(update_fields=['don_gia', 'thanh_tien'])

            updated_items.append({
                'ma_vt': ma_vt,
                'ten_hang': quotation_item.ten_hang,
                'don_gia_cu': int(old_don_gia),
                'don_gia_moi': int(new_don_gia),
                'thanh_tien_moi': int(quotation_item.thanh_tien),
            })

        if not_found:
            return Response(
                {'error': f'Khong tim thay ma_vt trong bao gia: {", ".join(not_found)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Recalculate tong_cong
        items_after = list(quotation.items.all())
        new_tong_cong = sum(item.thanh_tien for item in items_after)
        quotation.tong_cong = new_tong_cong
        quotation.save(update_fields=['tong_cong', 'updated_at'])

        # Regenerate Excel
        file_path = _save_excel_file_for_quotation(quotation)
        if not file_path:
            return Response(
                {'error': 'Khong the tao file Excel'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'success': True,
            'quote_number': quotation.quote_number,
            'tong_cong': int(new_tong_cong),
            'tong_cong_display': f'{int(new_tong_cong):,} VND',
            'excel_file_path': quotation.excel_file_path,
            'excel_file_name': quotation.excel_file_name,
            'excel_file_size': quotation.excel_file_size,
            'items_updated': updated_items,
            'items_unchanged': unchanged_items,
            'download_url': f'/api/quotations/{quotation.id}/download-excel/',
            'download_url_by_number': f'/api/quotations/by-number/{quotation.quote_number}/download-excel/',
        })


class QuotationDownloadExcelView(APIView):
    """Download the Excel file saved for a quotation."""

    def get(self, request, pk=None, quote_number=None):
        try:
            if pk is not None:
                quotation = models.Quotation.objects.get(pk=pk)
            else:
                quotation = models.Quotation.objects.get(quote_number=quote_number)
        except models.Quotation.DoesNotExist:
            return Response({'error': 'Khong tim thay bao gia'}, status=404)

        if not quotation.excel_file_path:
            file_path = _save_excel_file_for_quotation(quotation)
            if not file_path:
                return Response({'error': 'Bao gia nay khong co dong san pham de tao file Excel'}, status=404)
        else:
            try:
                file_path = _resolve_export_path(quotation.excel_file_path)
            except ValueError as exc:
                return Response({'error': str(exc)}, status=400)

        if not file_path.is_file():
            file_path = _save_excel_file_for_quotation(quotation)
            if not file_path or not file_path.is_file():
                return Response({'error': 'File Excel khong con ton tai tren server'}, status=404)

        filename = quotation.excel_file_name or file_path.name
        response = FileResponse(
            open(file_path, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Quotation-Id'] = str(quotation.id)
        response['X-Quote-Number'] = quotation.quote_number
        return response


class QuotationTodayListView(generics.ListAPIView):
    """Danh sách báo giá đã gởi trong ngày hôm nay."""

    serializer_class = serializers.QuotationListSerializer
    pagination_class = None  # Không phân trang, trả về array trực tiếp

    def get_queryset(self):
        from django.utils import timezone
        today = timezone.localdate()
        return models.Quotation.objects.filter(
            quote_date=today
        ).select_related('customer').prefetch_related('items').order_by('-created_at')


class QuotationTodayStatsView(APIView):
    """Thống kê nhanh báo giá hôm nay."""

    def get(self, request):
        from django.utils import timezone
        from django.db.models import Count, Sum, Q
        today = timezone.localdate()
        qs = models.Quotation.objects.filter(quote_date=today)
        stats = qs.aggregate(
            tong_bg=Count('id'),
            tong_sp=Sum('product_count'),
            tong_tien=Sum('tong_cong'),
            so_kh=Count('customer_id', distinct=True),
        )
        by_status = qs.values('status').annotate(cnt=Count('id')).order_by('status')
        da_chot = next((s['cnt'] for s in by_status if s['status'] == 'DA_CHOT'), 0)
        da_gui = next((s['cnt'] for s in by_status if s['status'] == 'DA_GUI'), 0)
        thua = next((s['cnt'] for s in by_status if s['status'] == 'THUA'), 0)

        return Response({
            'tong_bg': stats['tong_bg'] or 0,
            'tong_sp': stats['tong_sp'] or 0,
            'tong_tien': int(stats['tong_tien'] or 0),
            'so_kh': stats['so_kh'] or 0,
            'da_chot': da_chot,
            'da_gui': da_gui,
            'thua': thua,
        })


class QuotationUpdateView(generics.UpdateAPIView):
    """Cập nhật trạng thái + ghi chú báo giá."""

    queryset = models.Quotation.objects.all()
    serializer_class = serializers.QuotationUpdateSerializer


class QuotationHistoryListView(generics.ListAPIView):
    """Danh sách báo giá theo khoảng ngày (date_from, date_to)."""

    serializer_class = serializers.QuotationListSerializer
    pagination_class = None  # Không phân trang, trả về array trực tiếp

    def get_queryset(self):
        from datetime import datetime, date
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        qs = models.Quotation.objects.all()

        if date_from:
            try:
                d = datetime.strptime(date_from, '%Y-%m-%d').date()
                qs = qs.filter(quote_date__gte=d)
            except ValueError:
                pass

        if date_to:
            try:
                d = datetime.strptime(date_to, '%Y-%m-%d').date()
                qs = qs.filter(quote_date__lte=d)
            except ValueError:
                pass

        # Default: hôm nay nếu không có params
        if not date_from and not date_to:
            from django.utils import timezone
            qs = qs.filter(quote_date=timezone.localdate())

        return qs.select_related('customer').prefetch_related('items').order_by('-created_at')


class QuotationHistoryStatsView(APIView):
    """Thống kê báo giá theo khoảng ngày."""

    def get(self, request):
        from datetime import datetime
        from django.db.models import Count, Sum
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = models.Quotation.objects.all()

        if date_from:
            try:
                d = datetime.strptime(date_from, '%Y-%m-%d').date()
                qs = qs.filter(quote_date__gte=d)
            except ValueError:
                pass

        if date_to:
            try:
                d = datetime.strptime(date_to, '%Y-%m-%d').date()
                qs = qs.filter(quote_date__lte=d)
            except ValueError:
                pass

        if not date_from and not date_to:
            from django.utils import timezone
            qs = qs.filter(quote_date=timezone.localdate())

        stats = qs.aggregate(
            tong_bg=Count('id'),
            tong_sp=Sum('product_count'),
            tong_tien=Sum('tong_cong'),
            so_kh=Count('customer_id', distinct=True),
        )
        by_status = qs.values('status').annotate(cnt=Count('id')).order_by('status')
        da_chot = next((s['cnt'] for s in by_status if s['status'] == 'DA_CHOT'), 0)
        da_gui = next((s['cnt'] for s in by_status if s['status'] == 'DA_GUI'), 0)
        thua = next((s['cnt'] for s in by_status if s['status'] == 'THUA'), 0)

        return Response({
            'tong_bg': stats['tong_bg'] or 0,
            'tong_sp': stats['tong_sp'] or 0,
            'tong_tien': int(stats['tong_tien'] or 0),
            'so_kh': stats['so_kh'] or 0,
            'da_chot': da_chot,
            'da_gui': da_gui,
            'thua': thua,
        })
