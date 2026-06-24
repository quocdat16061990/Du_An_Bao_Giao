
Tai lieu nay ghi lai cac loi da gap khi deploy du an `Du_An_Bao_Giao` tren server va cach da xu ly den khi domain chay duoc HTTPS.

Domain hien tai:

```bash
https://luanmienam.devoverflow.xyz
```

## 1. Loi thieu file `.env`

Loi ban dau:

```bash
env file /root/Du_An_Bao_Giao/.env not found
```

Nguyen nhan:

- `docker-compose.yml` khai bao `env_file: .env`
- Thuc te file moi truong dang nam tai `backend/.env`

Da sua trong `docker-compose.yml`:

```yaml
backend:
  env_file:
    - backend/.env
```

Lenh kiem tra:

```bash
docker compose config
```

## 2. Loi frontend `npm ci` do ESLint conflict

Loi:

```bash
npm error ERESOLVE could not resolve
eslint-plugin-react@7.37.5
Found: eslint@10.4.1
```

Nguyen nhan:

- `eslint-plugin-react@7.37.5` chua ho tro `eslint@10`
- Dockerfile frontend chay `npm ci`, nen dependency conflict lam build dung

Da sua trong `frontend/package.json`:

```json
"eslint": "^9.39.4",
"@eslint/js": "^9.39.4"
```

Sau do cap nhat lockfile:

```bash
cd /root/Du_An_Bao_Giao/frontend
npm install --package-lock-only
npm ci
```

## 3. Loi backend thieu `dotenv`

Loi:

```bash
ModuleNotFoundError: No module named 'dotenv'
```

Nguyen nhan:

- `manage.py` co dong:

```python
from dotenv import load_dotenv
```

- Nhung Docker image backend chua cai package `python-dotenv`

Da sua trong `Dockerfile.backend`:

```dockerfile
RUN pip install --no-cache-dir \
    django \
    djangorestframework \
    django-cors-headers \
    django-filter \
    python-dotenv \
    psycopg2-binary \
    gunicorn
```

## 4. Loi backend `STATIC_ROOT`

Loi:

```bash
django.core.exceptions.ImproperlyConfigured:
You're using the staticfiles app without having set the STATIC_ROOT setting
```

Nguyen nhan:

- Dockerfile backend chay:

```dockerfile
RUN python manage.py collectstatic --noinput
```

- Nhung `backend/settings.py` chua co `STATIC_ROOT`

Da sua trong `backend/settings.py`:

```python
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

Kiem tra backend build:

```bash
docker compose build backend
```

Ket qua dung:

```bash
157 static files copied to '/app/staticfiles'.
```

## 5. Loi frontend TypeScript khi `npm run build`

Loi:

```bash
RUN npm run build
tsc -b && vite build
```

Mot so loi da gap:

```bash
TS6133: declared but its value is never read
TS2367: types have no overlap
TS2551: Property does not exist on type Customer
TS2502: referenced directly or indirectly in its own type annotation
```

Nguyen nhan:

- Production build chay TypeScript strict.
- Co import/bien khong dung.
- Type `PhanLoai` thieu gia tri `ĐẠI_LÝ`, `KHÁC`.
- Mot so field `Customer` dung sai camelCase thay vi snake_case.
- `search/index.tsx` type `typeof products[0]` truoc khi `products` duoc khoi tao.

Da sua chinh:

- `frontend/src/pages/search/helper/types.ts`

```ts
export type PhanLoai =
  | 'VIP'
  | 'ƯU_ĐÃI'
  | 'ĐẠI_LÝ'
  | 'KHÁC'
  | 'NGOẠI_LỆ'
  | 'CHƯA_PL'
```

- `quotation-preview.tsx`: doi cac field ve snake_case:

```tsx
customer.phan_loai
customer.ten_kh
customer.dien_thoai
customer.nha_xe_name
customer.ghi_chu
```

- `search/index.tsx`: doi type filter client side:

```ts
import type { Product, SearchParams } from './helper/types'

const filterClientSide = useCallback((p: Product) => {
  ...
}, [selectedHangMay, selectedThuongHieu])
```

- Xoa cac import/bien khong dung trong cac file component.

Kiem tra frontend build:

```bash
cd /root/Du_An_Bao_Giao/frontend
npm run build
```

Ket qua dung:

```bash
✓ built
```

Ghi chu: Vite co the bao warning chunk lon, nhung day chi la canh bao toi uu bundle, khong lam build fail.

## 6. Loi thieu network `traefik`

Loi:

```bash
network traefik declared as external, but could not be found
```

Nguyen nhan:

- `docker-compose.yml` khai bao network `traefik` la external.
- Docker khong tu tao network external.

Lenh tao network:

```bash
docker network create traefik
```

## 7. App da chay nhung domain chua vao duoc

Trang thai luc do:

```bash
docker ps

turbodiesel-frontend   80/tcp
turbodiesel-backend    8000/tcp
```

Nguyen nhan:

- Frontend chi `expose: 80`, nghia la chi mo port noi bo Docker.
- Khong co container Traefik nao bind port public `80` va `443`.
- Domain can proxy public vao frontend.

Kiem tra port:

```bash
ss -ltnp
```

Kiem tra DNS:

```bash
getent hosts luanmienam.devoverflow.xyz
curl -4 -s ifconfig.me
```

Ket qua DNS luc xu ly:

```bash
187.77.142.219  luanmienam.devoverflow.xyz
187.77.142.219
```

Tuc la domain da tro dung IP server.

## 8. Them Traefik service vao compose

Da them service `traefik` vao `docker-compose.yml`:

```yaml
services:
  traefik:
    image: traefik:v3.6
    container_name: traefik
    restart: always
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesresolvers.mytlschallenge.acme.email=admin@devoverflow.xyz"
      - "--certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - traefik_letsencrypt:/letsencrypt
    networks:
      - traefik
```

Da them volume:

```yaml
volumes:
  traefik_letsencrypt:
  static_volume:
  media_volume:
```

Da sua labels frontend:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=traefik"
  - "traefik.http.routers.turbodiesel-http.rule=Host(`luanmienam.devoverflow.xyz`)"
  - "traefik.http.routers.turbodiesel-http.entrypoints=web"
  - "traefik.http.routers.turbodiesel-http.middlewares=turbodiesel-https-redirect"
  - "traefik.http.middlewares.turbodiesel-https-redirect.redirectscheme.scheme=https"
  - "traefik.http.routers.turbodiesel.rule=Host(`luanmienam.devoverflow.xyz`)"
  - "traefik.http.routers.turbodiesel.entrypoints=websecure"
  - "traefik.http.routers.turbodiesel.tls=true"
  - "traefik.http.routers.turbodiesel.tls.certresolver=mytlschallenge"
  - "traefik.http.services.turbodiesel.loadbalancer.server.port=80"
```

Dong `version: '3.8'` cung da bo de het warning obsolete cua Docker Compose.

## 9. Loi frontend production goi API ve localhost

Loi tren browser console:

```bash
GET http://localhost:8000/api/v1/categories/ net::ERR_CONNECTION_REFUSED
GET http://localhost:8000/api/v1/products/ net::ERR_CONNECTION_REFUSED
API Error: Không thể kết nối đến máy chủ
```

Nguyen nhan:

- Frontend production build dang lay default API URL la `http://localhost:8000/api/v1`.
- Khi nguoi dung mo web, `localhost` la may cua nguoi dung, khong phai container backend tren server.
- Nginx frontend da co proxy `/api/` sang backend noi bo, nen frontend nen goi API bang relative path.

Da sua trong `frontend/src/services/config.ts`:

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
```

Da sua trong `frontend/.env.example`:

```bash
VITE_API_BASE_URL=/api/v1
```

Sau khi sua phai build lai frontend image va recreate frontend container:

```bash
cd /root/Du_An_Bao_Giao
docker compose build frontend
docker compose up -d frontend
```

Kiem tra bundle moi khong con `localhost:8000`:

```bash
curl -s https://luanmienam.devoverflow.xyz/assets/<ten-file-js-moi>.js \
  | rg 'localhost:8000|/api/v1'
```

Kiem tra API qua domain:

```bash
curl -I https://luanmienam.devoverflow.xyz/api/v1/categories/
curl -s https://luanmienam.devoverflow.xyz/api/v1/categories/ | head
```

Ket qua dung:

```bash
HTTP/2 200
content-type: application/json
```

## 10. Lenh deploy hien tai

Neu moi pull code ve server:

```bash
cd /root/Du_An_Bao_Giao
git pull origin main
docker network create traefik || true
docker compose up -d --build
```

Neu image da build roi va chi muon start lai:

```bash
cd /root/Du_An_Bao_Giao
docker compose up -d
```

Neu muon tat app:

```bash
cd /root/Du_An_Bao_Giao
docker compose down
```

Lenh `docker compose down` se dung va remove container cua project, nhung khong xoa image/volume mac dinh.

## 11. Kiem tra sau khi chay

Kiem tra container:

```bash
docker compose ps
```

Trang thai dung:

```bash
traefik                Up   80:80, 443:443
turbodiesel-frontend   Up   80/tcp
turbodiesel-backend    Up   8000/tcp
```

Kiem tra HTTP redirect:

```bash
curl -I http://luanmienam.devoverflow.xyz
```

Ket qua dung:

```bash
HTTP/1.1 307 Temporary Redirect
Location: https://luanmienam.devoverflow.xyz/
```

Kiem tra HTTPS:

```bash
curl -I https://luanmienam.devoverflow.xyz
```

Ket qua dung:

```bash
HTTP/2 200
server: nginx
```

Kiem tra certificate:

```bash
openssl s_client \
  -connect luanmienam.devoverflow.xyz:443 \
  -servername luanmienam.devoverflow.xyz </dev/null 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates
```

Ket qua dung:

```bash
issuer=Let's Encrypt
subject=CN = luanmienam.devoverflow.xyz
```

## 12. Cac lenh debug huu ich

Xem logs tat ca service:

```bash
docker compose logs --tail=100
```

Xem logs Traefik:

```bash
docker compose logs --tail=200 traefik
```

Xem logs frontend/backend:

```bash
docker compose logs --tail=100 frontend backend
```

Kiem tra network cua frontend:

```bash
docker inspect turbodiesel-frontend --format '{{json .NetworkSettings.Networks}}'
```

Kiem tra file ACME cua Traefik:

```bash
docker exec traefik sh -c 'ls -la /letsencrypt && wc -c /letsencrypt/acme.json'
```

## 13. Tong ket cac file da sua

- `docker-compose.yml`
  - Dung `backend/.env`
  - Them service `traefik`
  - Them HTTPS redirect
  - Them Let's Encrypt volume
  - Bo dong `version`

- `Dockerfile.backend`
  - Them `python-dotenv`

- `backend/settings.py`
  - Them `STATIC_ROOT`

- `frontend/package.json`
  - Ha `eslint` va `@eslint/js` ve `^9.39.4`

- `frontend/package-lock.json`
  - Cap nhat theo dependency moi

- `frontend/src/services/config.ts`
  - Doi default API base URL tu `http://localhost:8000/api/v1` sang `/api/v1`

- `frontend/.env.example`
  - Doi `VITE_API_BASE_URL=/api/v1`

- Cac file TypeScript frontend
  - Sua type `PhanLoai`
  - Sua field customer snake_case
  - Xoa import/bien khong dung
  - Sua type client-side filter
