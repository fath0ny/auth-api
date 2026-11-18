# Auth API

REST API untuk platform forum diskusi (thread, komentar, dan balasan) yang dilengkapi dengan sistem autentikasi berbasis **JSON Web Token (JWT)** serta otorisasi berbasis kepemilikan resource.

Project ini dibangun dengan **Node.js + Express** dan menerapkan **Clean Architecture** (pemisahan `Domains`, `Applications`, `Infrastructures`, dan `Interfaces`) sehingga business logic tidak bergantung langsung pada framework, database, atau library eksternal. Dependency antar layer dihubungkan menggunakan **dependency injection container**.

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Arsitektur & Struktur Project](#arsitektur--struktur-project)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Testing](#testing)
- [Dokumentasi API](#dokumentasi-api)
- [Daftar Endpoint](#daftar-endpoint)
- [Skema Database](#skema-database)
- [CI/CD](#cicd)
- [Script NPM](#script-npm)

---

## Fitur

### 1. Authentication

- **Registrasi user** dengan validasi payload (username wajib, maksimal 50 karakter, hanya boleh alfanumerik/underscore, password & fullname wajib).
- **Password hashing** menggunakan **bcrypt** — password tidak pernah disimpan dalam bentuk plain text.
- **Login** untuk mendapatkan **access token** dan **refresh token** (JWT).
- **Refresh access token** menggunakan refresh token yang masih terdaftar di database.
- **Logout** dengan menghapus refresh token dari database sehingga tidak dapat digunakan lagi.
- **Autentikasi request** melalui middleware yang memverifikasi header `Authorization: Bearer <access_token>`.
- Access token memiliki masa berlaku **3 jam**, sedangkan refresh token disimpan di tabel `authentications`.

### 2. Authorization

- **Ownership-based authorization**: user hanya boleh menghapus komentar atau balasan miliknya sendiri.
- Verifikasi kepemilikan dilakukan di use case (`verifyCommentOwner`, `verifyReplyOwner`) dan menghasilkan `AuthorizationError` (HTTP 403) bila bukan pemilik.
- Owner diambil dari payload JWT (`req.user.id`), bukan dari body request, sehingga tidak dapat dimanipulasi client.

### 3. Manajemen Thread

- Membuat thread baru (memerlukan autentikasi).
- Mengambil detail thread beserta seluruh komentar dan balasan di dalamnya.
- Setiap thread menyimpan `owner` dan `created_at`.

### 4. Manajemen Komentar

- Menambahkan komentar pada thread (memerlukan autentikasi).
- Menghapus komentar milik sendiri menggunakan mekanisme **soft delete** (`is_delete = TRUE`).
- Komentar yang dihapus tetap tampil pada detail thread dengan konten `**komentar telah dihapus**`.

### 5. Manajemen Balasan (Replies)

- Menambahkan balasan pada komentar (memerlukan autentikasi).
- Menghapus balasan milik sendiri dengan **soft delete** (`is_delete = TRUE`).
- Balasan yang dihapus ditampilkan dengan konten `**balasan telah dihapus**`.
- Balasan dikelompokkan per komentar pada response detail thread.
- Tersedia index database pada kolom `comment_id` untuk mempercepat query balasan.

### 6. Validasi & Error Handling

- **Domain error translation**: error bisnis (mis. `REGISTER_USER.NOT_CONTAIN_NEEDED_PROPERTY`) diterjemahkan menjadi HTTP response yang konsisten (`400`, `401`, `403`, `404`).
- Custom exception: `InvariantError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, dan `ClientError`.
- Response error konsisten dalam format:

  ```json
  {
    "status": "fail",
    "message": "pesan error"
  }
  ```

- Fallback `404` untuk resource/route yang tidak ditemukan.

### 7. Dokumentasi API (Swagger / OpenAPI)

- Dokumentasi interaktif tersedia di **`/api-docs`** menggunakan **swagger-jsdoc** + **swagger-ui-express**.
- Spesifikasi OpenAPI 3.0.0 dibuat otomatis dari anotasi JSDoc pada file routes.

### 8. Database Migration

- Pengelolaan skema database dengan **node-pg-migrate** (up/down migration).
- Migrasi terpisah untuk environment test melalui `.test.env`.

### 9. Testing & Code Coverage

- Unit test, integration test repository (PostgreSQL), dan HTTP/functional test menggunakan **Vitest** + **Supertest**.
- Table test helper untuk seeding dan cleaning data antar test.
- Coverage report menggunakan `@vitest/coverage-v8`.

### 10. CI/CD

- **CI** (`.github/workflows/ci.yml`): menjalankan migrasi + test pada setiap Pull Request ke `master` dengan service PostgreSQL.
- **CD** (`.github/workflows/cd.yml`): deploy otomatis ke server via SSH saat push ke `master`, menjalankan migrasi, lalu restart aplikasi dengan PM2.

> Catatan: project ini **belum** menggunakan message broker (RabbitMQ/Kafka), caching (Redis), atau queue. Semua proses berjalan secara sinkron di dalam request HTTP.

---

## Tech Stack

### Runtime & Bahasa

| Teknologi | Keterangan |
| --- | --- |
| **Node.js** | Runtime JavaScript (ES Modules, `"type": "module"`) |
| **JavaScript (ES2022+)** | Bahasa utama project |

### Framework & Library Utama

| Teknologi | Keterangan |
| --- | --- |
| **Express 5** | HTTP framework / routing |
| **PostgreSQL** (`pg`) | Database relasional & driver koneksi (`pg.Pool`) |
| **jsonwebtoken** | Pembuatan & verifikasi access/refresh token |
| **bcrypt** | Hashing & verifikasi password |
| **nanoid** | Generator ID unik untuk user, thread, komentar, dan balasan |
| **instances-container** | Dependency Injection container |
| **dotenv** | Manajemen environment variable |
| **swagger-jsdoc** + **swagger-ui-express** | Dokumentasi OpenAPI interaktif |

### Tooling & Development

| Teknologi | Keterangan |
| --- | --- |
| **node-pg-migrate** | Database migration |
| **Vitest** | Test runner |
| **@vitest/coverage-v8** | Code coverage |
| **Supertest** | HTTP integration testing |
| **ESLint** | Linting |
| **Nodemon** | Auto-reload saat development |
| **PM2** | Process manager untuk deployment |
| **GitHub Actions** | CI/CD pipeline |

### Pola & Arsitektur

- **Clean Architecture** (Domain, Application, Infrastructure, Interface layer)
- **Repository Pattern** (abstraksi akses data melalui interface repository)
- **Dependency Injection** dengan `instances-container`
- **Use Case Pattern** untuk setiap aksi bisnis
- **DTO / Entity validation** pada layer domain

---

## Arsitektur & Struktur Project

```text
.
├── coverage/                   # Hasil laporan code coverage
├── migrations/                 # File migrasi node-pg-migrate
├── src/
│   ├── app.js                  # Entry point aplikasi
│   ├── Applications/           # Layer use case & abstract security contract
│   │   ├── security/           # Interface PasswordHash & AuthenticationTokenManager
│   │   └── use_case/           # Business logic per fitur (AddUser, Login, AddThread, dll)
│   ├── Commons/                # Utility lintas layer
│   │   ├── config.js           # Loader environment variable
│   │   └── exceptions/         # Custom exception & DomainErrorTranslator
│   ├── Domains/                # Entity & repository contract (business rules)
│   │   ├── authentications/
│   │   ├── comments/
│   │   ├── replies/
│   │   ├── threads/
│   │   └── users/
│   ├── Infrastructures/        # Implementasi teknis
│   │   ├── database/postgres/  # Connection pool
│   │   ├── http/               # createServer & middleware authenticate
│   │   ├── repositories/       # Implementasi repository berbasis PostgreSQL
│   │   ├── security/           # Implementasi bcrypt & JWT
│   │   └── container.js        # Registrasi dependency injection
│   └── Interfaces/             # Delivery layer (HTTP)
│       └── http/api/           # Controller & route per resource
├── tests/                      # Table test helper
├── .github/workflows/          # CI & CD pipeline
├── vitest.config.js
├── eslint.config.js
└── package.json
```

**Alur request:**

```text
HTTP Request → Routes → Middleware (authenticate) → Controller → Use Case
             → Domain Repository (contract) → Repository Postgres → PostgreSQL
```

---

## Prasyarat

- **Node.js** versi 24.x (sesuai pipeline CI)
- **npm**
- **PostgreSQL** (berjalan di `localhost:5432` atau sesuaikan environment)

---

## Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd auth-api

# 2. Install dependency
npm install

# 3. Siapkan PostgreSQL dan buat database
createdb authapi
createdb authapi_test

# 4. Salin dan sesuaikan environment variable
cp .env.example .env   # jika tersedia, atau buat manual

# 5. Jalankan migrasi database
npm run migrate up

# 6. Jalankan aplikasi
npm run start:dev
```

Aplikasi berjalan di `http://localhost:3000`.

---

## Konfigurasi Environment

Buat file `.env` pada root project:

```env
# POSTGRES
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=authapi
PGPORT=5432

# HTTP SERVER
HOST=localhost
PORT=3000
NODE_ENV=development

# JSON Web Token
ACCESS_TOKEN_KEY=your_super_secret_key
```

Untuk testing, gunakan `.test.env` dengan database terpisah (mis. `authapi_test`) agar data test tidak mengotori database development.

| Variable | Deskripsi |
| --- | --- |
| `PGHOST` | Host PostgreSQL |
| `PGUSER` | Username PostgreSQL |
| `PGPASSWORD` | Password PostgreSQL |
| `PGDATABASE` | Nama database |
| `PGPORT` | Port PostgreSQL |
| `HOST` | Opsional. Saat ini host ditentukan otomatis: `localhost` untuk non-production dan `0.0.0.0` untuk production |
| `PORT` | Port HTTP server |
| `NODE_ENV` | Mode aplikasi (`development`, `test`, `production`) |
| `ACCESS_TOKEN_KEY` | Secret key untuk sign/verify JWT |

> ⚠️ Jangan commit file `.env` maupun secret key ke repository. File `.env` dan `.test.env` sudah masuk `.gitignore`.

---

## Menjalankan Aplikasi

```bash
# Development (auto-reload)
npm run start:dev

# Production
npm start
```

---

## Testing

Pastikan database test sudah dibuat dan `.test.env` dikonfigurasi, lalu:

```bash
# Jalankan seluruh test (single run)
npm test

# Jalankan test dengan watch mode + coverage
npm run test:watch

# Jalankan migrasi pada database test
npm run migrate:test up
```

Test mencakup:

- **Unit test** entity, use case, exception, dan utility.
- **Integration test** repository dengan PostgreSQL.
- **Functional/HTTP test** endpoint menggunakan Supertest.

---

## Dokumentasi API

Setelah aplikasi berjalan, buka:

```text
http://localhost:3000/api-docs
```

Halaman Swagger UI menyediakan dokumentasi endpoint beserta contoh request body dan response.

---

## Daftar Endpoint

Base URL: `http://localhost:3000`

### Users

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/users` | ❌ | Registrasi user baru |

**Request body:**

```json
{
  "username": "johndoe",
  "password": "secret",
  "fullname": "John Doe"
}
```

### Authentications

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/authentications` | ❌ | Login, mengembalikan `accessToken` & `refreshToken` |
| `PUT` | `/authentications` | ❌ | Refresh access token |
| `DELETE` | `/authentications` | ❌ | Logout (hapus refresh token) |

**Login request body:**

```json
{
  "username": "johndoe",
  "password": "secret"
}
```

**Refresh / logout request body:**

```json
{
  "refreshToken": "<refresh_token>"
}
```

### Threads

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/threads` | ✅ | Membuat thread baru |
| `GET` | `/threads/:threadId` | ❌ | Detail thread + komentar + balasan |

**Create thread request body:**

```json
{
  "title": "Judul thread",
  "body": "Isi thread"
}
```

### Comments

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/threads/:threadId/comments` | ✅ | Menambahkan komentar pada thread |
| `DELETE` | `/threads/:threadId/comments/:commentId` | ✅ | Soft delete komentar (hanya pemilik) |

**Create comment request body:**

```json
{
  "content": "Isi komentar"
}
```

### Replies

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/threads/:threadId/comments/:commentId/replies` | ✅ | Menambahkan balasan pada komentar |
| `DELETE` | `/threads/:threadId/comments/:commentId/replies/:replyId` | ✅ | Soft delete balasan (hanya pemilik) |

**Create reply request body:**

```json
{
  "content": "Isi balasan"
}
```

### Lainnya

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/` | Health check sederhana (`Hello world!`) |
| `GET` | `/api-docs` | Swagger UI |

**Header autentikasi untuk endpoint bertanda ✅:**

```http
Authorization: Bearer <access_token>
```

**Contoh response sukses:**

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

---

## Skema Database

### `users`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `VARCHAR(50)` | Primary key (nanoid) |
| `username` | `VARCHAR(50)` | Unik, wajib |
| `password` | `TEXT` | Hash bcrypt, wajib |
| `fullname` | `TEXT` | Wajib |

### `authentications`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `token` | `TEXT` | Refresh token aktif |

### `threads`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `VARCHAR(50)` | Primary key |
| `title` | `TEXT` | Wajib |
| `body` | `TEXT` | Wajib |
| `owner` | `VARCHAR(50)` | FK → `users.id` (CASCADE) |
| `created_at` | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |

### `comments`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `VARCHAR(50)` | Primary key |
| `content` | `TEXT` | Wajib |
| `owner` | `VARCHAR(50)` | FK → `users.id` (CASCADE) |
| `thread_id` | `VARCHAR(50)` | FK → `threads.id` (CASCADE) |
| `is_delete` | `BOOLEAN` | Default `false` (soft delete) |
| `created_at` | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |

### `replies`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `VARCHAR(50)` | Primary key |
| `content` | `TEXT` | Wajib |
| `owner` | `VARCHAR(50)` | FK → `users.id` (CASCADE) |
| `comment_id` | `VARCHAR(50)` | FK → `comments.id` (CASCADE) |
| `is_delete` | `BOOLEAN` | Default `false` (soft delete) |
| `created_at` | `TIMESTAMPTZ` | Default `CURRENT_TIMESTAMP` |

---

## CI/CD

### Continuous Integration — `.github/workflows/ci.yml`

Dipicu pada setiap **Pull Request ke `master`**:

1. Menyiapkan PostgreSQL service (`authapi_test`).
2. `npm ci` untuk install dependency.
3. `npm run migrate up` untuk menyiapkan skema.
4. `npm run test` untuk menjalankan seluruh test.

### Continuous Deployment — `.github/workflows/cd.yml`

Dipicu pada setiap **push ke `master`**, terhubung ke server melalui SSH lalu:

1. `git pull origin master`
2. `npm ci --no-audit --no-fund`
3. `npm run migrate up`
4. `npm prune --omit=dev`
5. `pm2 restart auth-api` (atau start jika belum berjalan)

---

## Script NPM

| Script | Perintah | Deskripsi |
| --- | --- | --- |
| `npm start` | `node src/app.js` | Menjalankan aplikasi |
| `npm run start:dev` | `nodemon src/app.js` | Menjalankan dengan auto-reload |
| `npm test` | `vitest --run` | Menjalankan test sekali jalan |
| `npm run test:watch` | `vitest --watch --coverage` | Watch mode + coverage |
| `npm run migrate` | `node-pg-migrate` | Perintah migrasi database |
| `npm run migrate:test` | `node-pg-migrate --envPath .test.env` | Migrasi database test |

Contoh penggunaan migrasi:

```bash
npm run migrate up         # jalankan semua migrasi
npm run migrate down       # rollback satu migrasi
npm run migrate create nama-migrasi
```

---

## Author

**fath0ny**
GitHub: [https://github.com/fath0ny](https://github.com/fath0ny)

Repository: [https://github.com/fath0ny/auth-api](https://github.com/fath0ny/auth-api)