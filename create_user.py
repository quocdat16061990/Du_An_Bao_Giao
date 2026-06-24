#!/usr/bin/env python3
"""Tao user luanmiennam cho Django tren Supabase."""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.contrib.auth.models import User

username = 'luanmiennam'
password = 'luanmiennam'
email = 'luanmiennam@gmail.com'

if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f'User {username} da duoc reset password + active')
else:
    user = User.objects.create_superuser(username=username, email=email, password=password)
    user.is_active = True
    user.save()
    print(f'User {username} da duoc tao thanh cong')
