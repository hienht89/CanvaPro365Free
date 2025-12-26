# CanvaPro365Free

🎨 **Nền tảng chia sẻ link Canva Pro & Canva Education miễn phí**

![Version](https://img.shields.io/badge/version-5.5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)

## 🌟 Tính Năng

- ✅ Chia sẻ link Canva Pro/Education an toàn
- ✅ Hệ thống quản lý link với slot tracking
- ✅ Admin panel với xác thực 2FA
- ✅ Đa ngôn ngữ (Tiếng Việt, English)
- ✅ Responsive design cho mọi thiết bị
- ✅ Bảo vệ link với captcha
- ✅ Thống kê click realtime

## 🛠️ Công Nghệ

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State**: TanStack Query
- **i18n**: react-i18next

## 🚀 Deploy

### Railway (Khuyến nghị)
Xem hướng dẫn chi tiết: **[DEPLOY_ON_RAILWAY.md](./DEPLOY_ON_RAILWAY.md)**

### Yêu cầu
- Node.js >= 18.0.0
- npm hoặc yarn
- Tài khoản Supabase

## 💻 Development

### 1. Clone & Install

```bash
git clone https://github.com/your-username/canvapro365free.git
cd canvapro365free
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền thông tin Supabase:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 3. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:8080](http://localhost:8080)

### 4. Build production

```bash
npm run build
npm run preview
```

## 📁 Cấu Trúc Project

```
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks
│   ├── i18n/            # Translations
│   ├── integrations/    # Supabase client
│   ├── lib/             # Utilities
│   ├── pages/           # Route pages
│   └── types/           # TypeScript types
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
├── .env.example         # Environment template
├── railway.json         # Railway config
├── nixpacks.toml        # Build config
└── DEPLOY_ON_RAILWAY.md # Deployment guide
```

## 🔧 Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🔐 Biến Môi Trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `PORT` | ❌ | Port for production (default: 8080) |

## 📝 License

MIT License - Xem [LICENSE](./LICENSE) để biết thêm chi tiết.

## 🤝 Đóng Góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📞 Liên Hệ

- **Telegram**: [@sharecanvaprofree](https://t.me/sharecanvaprofree)
- **Website**: [canvapro365free.com](https://canvapro365free.com)

---

**⭐ Nếu thấy hữu ích, hãy cho project một star!**
