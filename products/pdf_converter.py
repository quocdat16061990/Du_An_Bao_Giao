import os
import shutil
import subprocess
import tempfile
from pathlib import Path


class LibreOfficeNotFoundError(Exception):
    pass


def _find_soffice_executable() -> str:
    env_paths = [
        os.environ.get('SOFFICE_PATH'),
        os.environ.get('LIBREOFFICE_PATH'),
    ]
    for value in env_paths:
        if not value:
            continue
        path = Path(value)
        if path.is_dir():
            path = path / 'program' / ('soffice.com' if os.name == 'nt' else 'soffice')
        if path.exists():
            return str(path)

    windows_paths = [
        Path(r"C:\Program Files\LibreOffice\program\soffice.exe"),
        Path(r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"),
        Path(r"D:\Tools\LibreOfficePortable\App\libreoffice\program\soffice.exe"),
        Path(r"D:\ToolsLibreOfficePortable\App\libreoffice\program\soffice.exe"),
    ]

    for path in windows_paths:
        if path.exists():
            return str(path)

    soffice = shutil.which('soffice') or shutil.which('libreoffice')
    if soffice:
        return soffice

    raise LibreOfficeNotFoundError(
        'Khong tim thay LibreOffice tren may chu. Vui long cai dat LibreOffice '
        'hoac them lenh soffice vao bien moi truong PATH/SOFFICE_PATH.'
    )


def convert_excel_to_pdf(excel_path: Path, output_dir: Path) -> Path:
    """Convert an Excel workbook to PDF using LibreOffice in headless mode."""
    excel_path = Path(excel_path).resolve()
    output_dir = Path(output_dir).resolve()

    if not excel_path.exists():
        raise FileNotFoundError(f'Khong tim thay file Excel tam: {excel_path}')

    soffice_cmd = _find_soffice_executable()
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        with tempfile.TemporaryDirectory(
            prefix='lo_profile_',
            ignore_cleanup_errors=True,
        ) as profile_dir:
            result = subprocess.run(
                [
                    soffice_cmd,
                    f'-env:UserInstallation={Path(profile_dir).resolve().as_uri()}',
                    '--headless',
                    '--nologo',
                    '--nolockcheck',
                    '--convert-to',
                    'pdf',
                    '--outdir',
                    str(output_dir),
                    str(excel_path),
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
                timeout=120,
            )
    except subprocess.TimeoutExpired as exc:
        raise LibreOfficeNotFoundError(
            'LibreOffice mat qua lau de chuyen Excel sang PDF. Vui long thu lai '
            'hoac kiem tra tien trinh LibreOffice tren may chu.'
        ) from exc
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        details = ''
        if isinstance(exc, subprocess.CalledProcessError):
            details = (exc.stderr or exc.stdout or '').strip()
        raise LibreOfficeNotFoundError(
            f'LibreOffice khong chuyen duoc Excel sang PDF. {details}'.strip()
        ) from exc

    pdf_path = output_dir / f'{excel_path.stem}.pdf'
    if not pdf_path.exists():
        raise FileNotFoundError(
            'LibreOffice da chay xong nhung khong tao ra file PDF. '
            f'Stdout: {(result.stdout or "").strip()}'
        )

    return pdf_path
