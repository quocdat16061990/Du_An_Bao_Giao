from django.urls import path
from . import views

urlpatterns = [
    # Products
    path('products/', views.ProductListCreateView.as_view(), name='product-list'),
    path('products/stats/', views.ProductStatsView.as_view(), name='product-stats'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),

    # Danh mục
    path('hang-may/', views.HangMayListView.as_view(), name='hang-may-list'),
    path('hang-sx/', views.HangSxListView.as_view(), name='hang-sx-list'),
    path('thuong-hieu/', views.ThuongHieuListView.as_view(), name='thuong-hieu-list'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Import Excel
    path('imports/excel/preview/', views.ExcelImportPreviewView.as_view(), name='excel-import-preview'),
    path('imports/excel/check-db/', views.ExcelImportCheckDbView.as_view(), name='excel-import-check-db'),
    path('imports/excel/sync-missing/', views.ExcelImportSyncMissingView.as_view(), name='excel-import-sync-missing'),
    path('imports/excel/commit/', views.ExcelImportCommitView.as_view(), name='excel-import-commit'),
    path('imports/images/scan/', views.ProductImageImportScanView.as_view(), name='product-image-import-scan'),
    path('imports/images/sync/', views.ProductImageImportSyncView.as_view(), name='product-image-import-sync'),

    # Customers
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
    path('customers/search/', views.CustomerSearchView.as_view(), name='customer-search'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),

    # Nhà xe
    path('nha-xe/', views.NhaXeListView.as_view(), name='nha-xe-list'),

    # Quotation
    path('quotations/preview/', views.QuotationPreviewView.as_view(), name='quotation-preview'),
    path('quotations/export-csv/', views.QuotationExportCSVView.as_view(), name='quotation-export-csv'),
    path('quotations/export-excel/', views.QuotationExportExcelView.as_view(), name='quotation-export-excel'),
    path('quotations/preview-pdf/', views.QuotationPreviewPDFView.as_view(), name='quotation-preview-pdf'),
    path('quotations/export-pdf/', views.QuotationExportPDFView.as_view(), name='quotation-export-pdf'),
    path('quotations/save/', views.QuotationSaveView.as_view(), name='quotation-save'),
    path('quotations/today/', views.QuotationTodayListView.as_view(), name='quotation-today'),
    path('quotations/today/stats/', views.QuotationTodayStatsView.as_view(), name='quotation-today-stats'),
    path('quotations/<int:pk>/update-items/', views.QuotationUpdateItemsView.as_view(), name='quotation-update-items'),
    path('quotations/<int:pk>/download-excel/', views.QuotationDownloadExcelView.as_view(), name='quotation-download-excel'),
    path(
        'quotations/by-number/<str:quote_number>/download-excel/',
        views.QuotationDownloadExcelView.as_view(),
        name='quotation-download-excel-by-number',
    ),
    path('quotations/<int:pk>/update/', views.QuotationUpdateView.as_view(), name='quotation-update'),
    path('quotations/history/', views.QuotationHistoryListView.as_view(), name='quotation-history'),
    path('quotations/history/stats/', views.QuotationHistoryStatsView.as_view(), name='quotation-history-stats'),
]
