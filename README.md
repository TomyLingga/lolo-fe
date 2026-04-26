# Container Tracking System — Frontend

Aplikasi manajemen kontainer berbasis Next.js 14.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark theme)
- **Axios** — HTTP client dengan token interceptor
- **react-hot-toast** — notifikasi
- **js-cookie** — manajemen token
- **lucide-react** — ikon

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Konfigurasi environment
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL sesuai URL backend Laravel Anda

# 3. Jalankan development server
npm run dev
```

## Struktur Project

```
container-tracking/
├── app/
│   ├── login/              # Halaman login
│   ├── dashboard/          # Dashboard (kosong, siap dikembangkan)
│   ├── registrations/      # Manajemen registrasi kontainer
│   ├── invoices/           # Manajemen invoice
│   ├── tariffs/            # Tarif LOLO & Storage (admin only)
│   └── master/
│       ├── users/          # Manajemen user (admin only)
│       ├── freight-forwarders/
│       ├── yards/          # Yard & Block (expandable)
│       ├── container-sizes/ # Ukuran & Tipe container
│       ├── cargo-statuses/
│       └── taxes/          # Tax & Discount
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # Sidebar navigasi dengan role-based menu
│   │   └── AppLayout.tsx   # Layout wrapper dengan mobile hamburger
│   ├── ui/
│   │   ├── Modal.tsx       # Modal reusable
│   │   ├── ConfirmDialog.tsx
│   │   ├── DataTable.tsx   # Tabel dengan sort & filter per kolom
│   │   ├── Timeline.tsx    # Komponen timeline untuk riwayat
│   │   ├── PageHeader.tsx
│   │   ├── Spinner.tsx
│   │   └── EmptyState.tsx
│   └── modals/
│       ├── RegistrationFormModal.tsx
│       ├── LoloFormModal.tsx
│       ├── StorageFormModal.tsx
│       ├── LoloTimelineModal.tsx
│       ├── StorageTimelineModal.tsx
│       └── RemarkModal.tsx
├── lib/
│   ├── axios.ts    # Axios instance dengan auth interceptor
│   ├── api.ts      # Semua API service functions
│   ├── auth.ts     # Cookie-based auth helpers
│   └── utils.ts    # Format utilities
├── types/
│   └── index.ts    # TypeScript type definitions
└── hooks/
    └── useAuth.ts  # Auth guard hook
```

## Fitur

### Halaman Registrasi
- Filter: OPEN / CLOSED / Semua
- Filter tanggal (untuk CLOSED & Semua)
- Pencarian kontainer, FF, DO
- Tambah registrasi baru (dengan data LOLO & posisi awal)
- Tambah LOLO (Lift On / Lift Off, otomatis berganti sesuai terakhir)
- Pindah kontainer (tambah storage record)
- Lihat riwayat LOLO (timeline)
- Lihat riwayat Storage (timeline)
- Tambah & lihat catatan (remark)
- Tutup registrasi (hanya jika LOLO terakhir = Lift On)
- Edit registrasi (admin only)
- Nonaktifkan registrasi (admin only)

### Halaman Invoice
- Filter: DRAFT / PAID / Semua + filter tanggal
- Buat invoice dari registrasi yang belum diinvoice per FF
- Tandai PAID
- Cetak PDF (buka di tab baru)
- Nonaktifkan invoice (admin only)

### Tarif (Admin only)
- Tab Tarif LOLO & Tarif Storage
- CRUD lengkap dengan confirm dialog

### Master Data (Admin only)
- **User**: CRUD + reset password
- **Freight Forwarder**: CRUD lengkap
- **Yard & Block**: Expandable tree, form tambah yard sekaligus dengan blok-bloknya
- **Container Size & Type**: 2 tabel dalam 1 halaman
- **Cargo Status**: CRUD
- **Tax & Discount**: CRUD dengan tipe ADD/DEDUCT

### Role-based Access
- **Admin**: Akses penuh
- **Petugas**: Registrasi, Invoice (baca + operasional), tanpa Master Data & Tarif
