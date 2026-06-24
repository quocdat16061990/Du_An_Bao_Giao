"""
Tạo tài khoản demo để test authentication.
Usage: python manage.py create_demo_user
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Tạo tài khoản demo admin/admin123 để test auth'

    def handle(self, *args, **options):
        username = 'admin'
        password = 'admin123'
        email = 'admin@turbodiesel.com'

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'[OK] Created demo user: {username} / {password}'
            ))
        else:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'[OK] Reset demo user: {username} / {password}'
            ))
