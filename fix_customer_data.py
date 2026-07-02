#!/usr/bin/env python3
"""Fix duplicate customer data issues in Supabase."""
import sys, os
from pathlib import Path

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / 'backend' / '.env')
django.setup()

from products.models import Customer
from django.db import connection

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print('=== FIX PHAN LOAI VALUES ===')

# Fix 1: CHUA_PL -> CHƯA_PL (my script used wrong spelling)
fixed1 = Customer.objects.filter(phan_loai='CHUA_PL').update(phan_loai='CHƯA_PL')
print(f'[1] CHUA_PL -> CHƯA_PL: {fixed1} updated')

# Fix 2: UU_DAI -> ƯU_ĐÃI (if any)
fixed2 = Customer.objects.filter(phan_loai='UU_DAI').update(phan_loai='ƯU_ĐÃI')
print(f'[2] UU_DAI -> ƯU_ĐÃI: {fixed2} updated')

# Fix 3: DAI_LY -> ĐẠI_LÝ (if any)
fixed3 = Customer.objects.filter(phan_loai='DAI_LY').update(phan_loai='ĐẠI_LÝ')
print(f'[3] DAI_LY -> ĐẠI_LÝ: {fixed3} updated')

# Fix 4: NGOAI_LE -> NGOẠI_LỆ (if any)
fixed4 = Customer.objects.filter(phan_loai='NGOAI_LE').update(phan_loai='NGOẠI_LỆ')
print(f'[4] NGOAI_LE -> NGOẠI_LỆ: {fixed4} updated')

print()
print('=== VERIFY AFTER FIX ===')
print(f'Total customers: {Customer.objects.count()}')

# Check distinct values
for pl in Customer.objects.values_list('phan_loai', flat=True).order_by('phan_loai').distinct():
    cnt = Customer.objects.filter(phan_loai=pl).count()
    print(f'  {pl}: {cnt}')

# Check for MA_KH duplicates again
print()
print('=== DUPLICATE CHECK ===')
from django.db.models import Count
dups_ma = Customer.objects.values('ma_kh').annotate(cnt=Count('id')).filter(cnt__gt=1).count()
print(f'MA_KH duplicates: {dups_ma}')

dups_name_phone = Customer.objects.values('ten_kh','dien_thoai').annotate(cnt=Count('id')).filter(cnt__gt=1).exclude(dien_thoai='').count()
print(f'Name+Phone duplicates: {dups_name_phone}')

print()
print('Done!')
