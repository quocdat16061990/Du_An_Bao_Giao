"""Import tất cả file Excel/Word trong thư mục docs/ theo thứ tự ưu tiên."""
import sys
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from products.models import ImportLog
from .importers.turbo_v13_gia import TurboV13GiaImporter
from .importers.turbo_claude import TurboClaudeImporter
from .importers.bo_hoi_moi import BoHoiMoiImporter
from .importers.tong_hop_phu_tung import TongHopPhuTungImporter
from .importers.ket_nuoc import KetNuocImporter

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


class Command(BaseCommand):
    help = 'Import all product data from docs/ folder'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Preview only, do not write to DB')
        parser.add_argument('--docs-dir', type=str, default='', help='Path to docs folder')
        parser.add_argument('--file', type=str, default='', help='Import a specific file only')
        parser.add_argument('--overwrite-prices', action='store_true', help='Overwrite existing prices')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        overwrite = options['overwrite_prices']
        specific_file = options['file']

        if options['docs_dir']:
            docs_dir = Path(options['docs_dir'])
        else:
            docs_dir = Path(settings.BASE_DIR) / 'docs'

        if not docs_dir.exists():
            self.stderr.write(f'Docs directory not found: {docs_dir}')
            return

        self.stdout.write(f'Docs dir: {docs_dir}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - no data will be written'))

        importers = [
            ('Turbo v13 (co gia)', TurboV13GiaImporter(dry_run=dry_run, overwrite_prices=True, batch_size=1000)),
            ('Turbo Claude (khong gia)', TurboClaudeImporter(dry_run=dry_run, overwrite_prices=overwrite, batch_size=1000)),
            ('Bo hoi moi', BoHoiMoiImporter(dry_run=dry_run, overwrite_prices=overwrite, batch_size=1000)),
            ('Tong hop phu tung', TongHopPhuTungImporter(dry_run=dry_run, overwrite_prices=overwrite, batch_size=1000)),
            ('Ket nuoc', KetNuocImporter(dry_run=dry_run, overwrite_prices=overwrite, batch_size=1000)),
        ]

        total_created = 0
        total_updated = 0

        for label, importer in importers:
            self.stdout.write(f'\n{"="*60}')
            self.stdout.write(f'  [{label}]')
            self.stdout.write(f'{"="*60}')

            if specific_file:
                file_path = Path(specific_file)
                if not file_path.exists():
                    file_path = docs_dir / specific_file
                if not file_path.exists():
                    self.stderr.write(f'  File not found: {specific_file}')
                    continue
                result = importer.import_file(file_path)
            else:
                matched = list(docs_dir.glob(importer.file_pattern))
                if not matched:
                    self.stdout.write(f'  No files matching "{importer.file_pattern}"')
                    continue

                result = None
                for fp in matched:
                    self.stdout.write(f'  File: {fp.name}')
                    result = importer.import_file(fp)

            if result:
                total_created += result.created
                total_updated += result.updated

                if not dry_run:
                    ImportLog.objects.create(
                        file_name=result.file_name,
                        status=result.status,
                        products_created=result.created,
                        products_updated=result.updated,
                        errors=result.errors,
                    )

                self.stdout.write(
                    f'  -> Created: {result.created}, Updated: {result.updated}, '
                    f'Skipped: {result.skipped}, Errors: {len(result.errors)}'
                )

        self.stdout.write(self.style.SUCCESS(
            f'\n{"="*60}\n'
            f'  IMPORT COMPLETE\n'
            f'  Total Created: {total_created}\n'
            f'  Total Updated: {total_updated}\n'
            f'{"="*60}'
        ))
