# 🚀 Hướng Dẫn Thiết Lập CI/CD cho Hostinger VPS

> Dành cho dự án **Turbo Diesel** — Django Backend + React Frontend + Docker

---

## 📋 Mục Lục

1. [Chuẩn Bị Trên VPS Hostinger](#1-chuẩn-bị-trên-vps-hostinger)
2. [Cài Đặt Docker & Git Trên VPS](#2-cài-đặt-docker--git-trên-vps)
3. [Clone Project Và Cấu Hình Môi Trường](#3-clone-project-và-cấu-hình-môi-trường)
4. [Tạo SSH Key Cho GitHub Actions](#4-tạo-ssh-key-cho-github-actions)
5. [Thiết Lập GitHub Secrets](#5-thiết-lập-github-secrets)
6. [Kiểm Tra Pipeline](#6-kiểm-tra-pipeline)

---

## 1. Chuẩn Bị Trên VPS Hostinger

### Mua VPS Hostinger

- Vào [hostinger.com](https://www.hostinger.com/vps-hosting)
- Chọn gói VPS (khuyên dùng **KVM 2** trở lên — 2 CPU, 4GB RAM)
- Chọn OS: **Ubuntu 22.04 LTS** hoặc **Ubuntu 24.04 LTS**
- Sau khi mua, lấy thông tin:
  - **IP VPS** (VD: `153.92.xxx.xxx`)
  - **Password root** (Hostinger gửi qua email)

### SSH vào VPS

```bash
ssh root@<IP_VPS_CUA_BAN>
# Nhập password root khi được hỏi
```

---

## 2. Cài Đặt Docker & Git Trên VPS

### Update hệ thống

```bash
apt update && apt upgrade -y
```

### Cài Docker

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com | sh

# Khởi động Docker
systemctl enable docker
systemctl start docker

# Kiểm tra
docker --version
```

### Cài Docker Compose (plugin mới)

```bash
# Docker Compose plugin đã đi kèm Docker từ phiên bản mới
docker compose version
```

### Cài Git

```bash
apt install git -y
git --version
```

---

## 3. Clone Project Và Cấu Hình Môi Trường

### Tạo thư mục project

```bash
mkdir -p /root/Du_An_Bao_Giao
cd /root/Du_An_Bao_Giao
```

### Clone repository

```bash
# Nếu repo public:
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git .

# Nếu repo private, tạo Personal Access Token trên GitHub trước:
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Chọn scope: repo
# Sau đó clone bằng:
git clone https://<TOKEN>@github.com/<YOUR_USERNAME>/<YOUR_REPO>.git .
```

### Tạo file .env cho Backend

```bash
cat > /root/Du_An_Bao_Giao/backend/.env << 'EOF'
SECRET_KEY=<TAO_SECRET_KEY_MANH_50_KY_TU>
DEBUG=False
DATABASE_URL=postgresql://user:password@host:5432/dbname
# Thay bằng connection string Supabase PostgreSQL của bạn
EOF
```

> 🔒 **Cách tạo SECRET_KEY mạnh:**
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

### Tạo network cho Traefik

```bash
docker network create traefik
```

### Chạy thử lần đầu

```bash
cd /root/Du_An_Bao_Giao
docker compose up -d --build
```

Kiểm tra container đã chạy chưa:

```bash
docker compose ps
docker compose logs -f
```

---

## 4. Tạo SSH Key Cho GitHub Actions

Trên VPS, tạo cặp SSH key riêng cho GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""
```

Thêm public key vào authorized_keys:

```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Lấy nội dung **private key** để đưa vào GitHub Secrets:

```bash
cat ~/.ssh/github_actions
```

Copy TOÀN BỘ output (bao gồm cả dòng `-----BEGIN OPENSSH PRIVATE KEY-----` và `-----END OPENSSH PRIVATE KEY-----`)

> ⚠️ **Quan trọng:** Đây là private key — giữ bí mật, chỉ paste vào GitHub Secrets!

---

## 5. Thiết Lập GitHub Secrets

Trên GitHub repo của bạn:

1. Vào **Settings** → **Secrets and variables** → **Actions**
2. Thêm các secrets sau:

| Secret Name     | Giá Trị                                          | Ví Dụ                        |
|-----------------|---------------------------------------------------|------------------------------|
| `VPS_HOST`      | IP VPS của bạn                                    | `153.92.xxx.xxx`             |
| `VPS_PORT`      | Port SSH (mặc định 22)                            | `22`                         |
| `VPS_USER`      | Username SSH                                      | `root`                       |
| `VPS_SSH_KEY`   | Nội dung private key ở bước 4                     | `-----BEGIN OPENSSH...`      |

---

## 6. Kiểm Tra Pipeline

### Push code lên main để trigger deploy

```bash
git add .
git commit -m "feat: them CI/CD pipeline"
git push origin main
```

### Theo dõi tiến trình

Vào tab **Actions** trên GitHub để xem pipeline chạy:

1. **test-backend** — chạy flake8 + Django tests
2. **test-frontend** — chạy ESLint + Build React
3. **deploy** — SSH vào VPS pull code + docker compose up

---

## 🔧 Xử Lý Sự Cố Thường Gặp

### 1. Port 22 bị chặn
Hostinger thường dùng port **65002** thay vì 22. Kiểm tra trong email Hostinger gửi hoặc trong bảng điều khiển VPS → SSH Details.

### 2. Docker compose không chạy được
```bash
# Kiểm tra log
docker compose logs -f

# Kiểm tra network traefik đã tạo chưa
docker network ls | grep traefik

# Nếu chưa có:
docker network create traefik
```

### 3. Backend không connect được database
Đảm bảo file `backend/.env` có `DATABASE_URL` đúng format:
```
DATABASE_URL=postgresql://user:password@host.supabase.co:5432/postgres
```

### 4. Let's Encrypt SSL không cấp được
- Đảm bảo domain đã trỏ về IP VPS (A record)
- Port 80 và 443 mở trên firewall VPS
- Kiểm tra log Traefik: `docker compose logs traefik`

### 5. Frontend không gọi được API
Cấu hình CORS trong `backend/settings.py` phải thêm domain production:
```python
CORS_ALLOWED_ORIGINS = [
    'https://luanmienam.devoverflow.xyz',
]
```

---

## 📁 Cấu Trúc File Trên VPS

```
/root/Du_An_Bao_Giao/
├── backend/
│   ├── .env           ← Chứa SECRET_KEY, DATABASE_URL
│   └── ...
├── frontend/
│   └── ...
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── entrypoint.sh
└── requirements.txt
```

---

## 🔄 Quy Trình Deploy

```
Developer push main
       ↓
GitHub Actions kích hoạt
       ↓
┌──────────────────────┐
│  1. test-backend     │  flake8 + Django tests (SQLite)
│  2. test-frontend    │  ESLint + Build React
└──────┬───────────────┘
       ↓ (chỉ khi cả 2 pass + push vào main)
┌──────────────────────┐
│  3. deploy           │  SSH → VPS
│                      │  git pull origin main
│                      │  docker compose down
│                      │  docker compose up -d --build
│                      │  docker image prune -f
└──────────────────────┘
       ↓
   ✅ Done! App chạy tại:
   https://luanmienam.devoverflow.xyz
```

---

## 📝 Lưu Ý

- **Traefik network** phải được tạo thủ công 1 lần: `docker network create traefik`
- File `.env` không commit lên git → phải tạo thủ công trên VPS
- Mỗi lần deploy, Docker build lại image → thời gian deploy ~1-3 phút
- `docker image prune -f` dọn image cũ để tiết kiệm disk
- Nếu dùng PostgreSQL trên Supabase, không cần chạy PostgreSQL container trên VPS
