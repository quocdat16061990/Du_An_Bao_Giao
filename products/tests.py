from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from decimal import Decimal
from .models import Product, Category, HangMay, Customer


class SmartSearchTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hang_may, _ = HangMay.objects.get_or_create(ten="TOYOTA", slug="toyota")
        self.cat_xy_lanh, _ = Category.objects.get_or_create(ten="Xy lanh", slug="xy-lanh")
        self.cat_piston, _ = Category.objects.get_or_create(ten="Piston", slug="piston")

        # Tạo sản phẩm 1: Động cơ 6D125, Piston
        self.p1 = Product.objects.create(
            ma_vt="HH01001",
            ten_hang="Piston 6D125",
            model_turbo="CT16",
            ma_dong_co="6D125",
            hang_may=self.hang_may,
            category=self.cat_piston,
            loai="piston",
            gia_von=Decimal("5000000"),
            gia_vip=Decimal("6000000"),
            gia_uu_dai=Decimal("6200000"),
            gia_dai_ly=Decimal("6500000"),
            gia_gara=Decimal("6800000"),
            gia_dl_10=Decimal("7000000"),
        )

        # Tạo sản phẩm 2: Động cơ 6D125, Xy lanh
        self.p2 = Product.objects.create(
            ma_vt="HH01002",
            ten_hang="Xy lanh 6D125",
            model_turbo="CT16V",
            ma_dong_co="6D125",
            hang_may=self.hang_may,
            category=self.cat_xy_lanh,
            loai="xy_lanh",
            gia_von=Decimal("3000000"),
            gia_vip=Decimal("3500000"),
            gia_uu_dai=Decimal("3800000"),
            gia_dai_ly=Decimal("4000000"),
            gia_gara=Decimal("4200000"),
            gia_dl_10=Decimal("4500000"),
        )

        # Tạo sản phẩm 3: Động cơ 4D30, Piston
        self.p3 = Product.objects.create(
            ma_vt="HH01003",
            ten_hang="Piston 4D30",
            model_turbo="",
            ma_dong_co="4D30",
            hang_may=self.hang_may,
            category=self.cat_piston,
            loai="piston",
            gia_von=Decimal("2000000"),
            gia_vip=Decimal("2200000"),
            gia_uu_dai=Decimal("2400000"),
            gia_dai_ly=Decimal("2600000"),
            gia_gara=Decimal("2800000"),
            gia_dl_10=Decimal("3000000"),
        )

    def test_search_single_keyword(self):
        # Tìm kiếm 1 từ: 6D125 -> Phải ra p1 và p2
        response = self.client.get(reverse('product-list'), {'q': '6D125'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        ids = [r['id'] for r in results]
        self.assertIn(self.p1.id, ids)
        self.assertIn(self.p2.id, ids)

    def test_search_multi_keyword_and_logic(self):
        # Tìm kiếm đa từ: '6d125 xy' -> Chỉ ra p2 (Xy lanh 6D125)
        response = self.client.get(reverse('product-list'), {'q': '6d125 xy'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.p2.id)

    def test_search_multi_keyword_comma_separated(self):
        # Tìm kiếm đa từ phân tách bằng dấu phẩy: '6d125, pis' -> Chỉ ra p1
        response = self.client.get(reverse('product-list'), {'q': '6d125, pis'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.p1.id)

    def test_filter_price_type_gara_and_von(self):
        # Lọc các sản phẩm có gia_gara không null
        response = self.client.get(reverse('product-list'), {'phan_loai_gia': 'gara'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

        # Lọc các sản phẩm có gia_von không null
        response = self.client.get(reverse('product-list'), {'phan_loai_gia': 'von'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)


class CustomerPriceTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Tạo test user và force authenticate vì POST API yêu cầu đăng nhập
        self.user = User.objects.create_user(username='testadmin', password='testpassword')
        self.client.force_authenticate(user=self.user)

        self.hang_may, _ = HangMay.objects.get_or_create(ten="TOYOTA", slug="toyota")
        self.p1 = Product.objects.create(
            ma_vt="HH02001",
            ten_hang="Turbo TD04",
            model_turbo="TD04",
            ma_dong_co="4D56",
            hang_may=self.hang_may,
            loai="turbo",
            gia_von=Decimal("4000000"),
            gia_vip=Decimal("4500000"),
            gia_uu_dai=Decimal("4800000"),
            gia_dai_ly=Decimal("5000000"),
            gia_gara=Decimal("5200000"),
            gia_dl_10=Decimal("5500000"),
        )

    def test_create_customer_with_new_phan_loai(self):
        # Tạo khách hàng Gara
        response = self.client.post(reverse('customer-list'), {
            "ten_kh": "Gara Autotech",
            "dien_thoai": "0987654321",
            "phan_loai": "GARA",
            "dia_chi": "Hà Nội"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['phan_loai'], "GARA")

        # Tạo khách hàng Đại lý
        response = self.client.post(reverse('customer-list'), {
            "ten_kh": "Đại lý Toàn Cầu",
            "dien_thoai": "0123456789",
            "phan_loai": "ĐẠI_LÝ",
            "dia_chi": "Hồ Chí Minh"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['phan_loai'], "ĐẠI_LÝ")

    def test_product_price_mapping_for_gara_and_dai_ly(self):
        # Kiểm tra ánh xạ trực tiếp trong Product model
        self.assertEqual(self.p1.get_price_for_type("GARA"), Decimal("5200000"))
        self.assertEqual(self.p1.get_price_for_type("ĐẠI_LÝ"), Decimal("5000000"))

        # Gửi thử tạo báo giá nháp cho khách Gara
        customer = Customer.objects.create(
            ma_kh="KH001",
            ten_kh="Gara Autotech",
            phan_loai="GARA"
        )
        response = self.client.post(reverse('quotation-preview'), {
            "customer_id": customer.id,
            "product_ids": [self.p1.id]
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Đơn giá phải là 5,200,000 đ
        product_quote = response.data['products'][0]
        self.assertEqual(int(float(product_quote['don_gia'])), 5200000)
