import logging

from datetime import datetime
from decimal import Decimal

from django.conf import settings
from django.db.models import Q, Count, Min, Max
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import models, serializers, filters
from .pagination import FastPagination

logger = logging.getLogger('products')


# ═══════════ Products ═══════════
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = serializers.ProductListSerializer
    filterset_class = filters.ProductFilter
    pagination_class = FastPagination
    ordering_fields = ['ma_vt', 'model_turbo', 'ten_hang', 'created_at', 'gia_vip', 'gia_uu_dai', 'gia_dai_ly']
    ordering = ['ma_vt']

    def get_queryset(self):
        qs = (
            models.Product.objects
            .filter(is_active=True)
            .select_related('hang_may', 'hang_sx', 'thuong_hieu', 'category')
            .defer('oem_part_no')
        )
        return qs


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


# ═══════════ Customers ═══════════
class CustomerListView(generics.ListAPIView):
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


# ═══════════ PDF Export ═══════════
class QuotationExportPDFView(APIView):
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
