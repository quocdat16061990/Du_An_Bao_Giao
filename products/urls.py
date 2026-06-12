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

    # Customers
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
    path('customers/search/', views.CustomerSearchView.as_view(), name='customer-search'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),

    # Nhà xe
    path('nha-xe/', views.NhaXeListView.as_view(), name='nha-xe-list'),

    # Quotation
    path('quotations/preview/', views.QuotationPreviewView.as_view(), name='quotation-preview'),
    path('quotations/export-csv/', views.QuotationExportCSVView.as_view(), name='quotation-export-csv'),
    path('quotations/export-pdf/', views.QuotationExportPDFView.as_view(), name='quotation-export-pdf'),
]
