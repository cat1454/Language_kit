# Language Kit

Language Kit là Web MVP luyện ngoại ngữ theo chu trình **nghe trước, nói và viết sau**. Ứng dụng quản lý luồng học, kiểm tra dữ liệu AI, lưu lỗi, tạo bài luyện lại và xuất dữ liệu; AI chỉ cung cấp đầu ra JSON có cấu trúc thông qua quy trình manual relay.

> Trạng thái: prototype phục vụ phát triển và kiểm chứng luồng học cá nhân. Dự án chưa có xác thực người dùng, thanh toán, hội thoại giọng nói thời gian thực hoặc tích hợp AI trả phí bắt buộc.

## Luồng học cốt lõi

```text
Chọn chủ đề và tình huống
  -> tạo prompt lesson_pack.v1
  -> gửi prompt tới công cụ AI bên ngoài
  -> dán JSON vào ứng dụng
  -> kiểm tra và lưu lesson pack
  -> luyện nghe
  -> khai thác cụm từ
  -> roleplay
  -> luyện viết và nhận feedback
  -> sửa lỗi bằng retry drill
  -> xem tiến độ và xuất JSONL
```

## Tính năng hiện có

- Tạo prompt theo ngôn ngữ đích, tiếng mẹ đẻ, CEFR, chủ đề và thời lượng.
- Kiểm tra nghiêm ngặt `lesson_pack.v1` và feedback bằng Zod.
- Tạo repair prompt khi JSON sai định dạng hoặc thiếu trường bắt buộc.
- Workspace luyện nghe, khai thác cụm từ, roleplay và viết theo cùng một tình huống.
- Ghi nhận listening attempt, error log và retry drill.
- Dashboard tiến độ cơ bản.
- Xuất năm bộ dữ liệu JSONL cho lesson generation, feedback, phân loại lỗi, retry và JSON repair.
- REST API dùng PostgreSQL và Drizzle ORM.
- Bộ kiểm thử unit, integration và end-to-end.

## Công nghệ

- Next.js 16, React 19 và TypeScript
- PostgreSQL 18, Drizzle ORM
- Zod
- Vitest và Playwright
- Docker Compose
- pnpm workspace

## Chạy nhanh

### Yêu cầu

- Node.js 22 LTS
- Corepack và pnpm 11
- Docker Desktop có Docker Compose

### Chạy ứng dụng trên máy, database trong Docker

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000). API health check ở [http://localhost:3000/api/health](http://localhost:3000/api/health).

Mặc định PostgreSQL chỉ bind vào `127.0.0.1:54320` và lưu dữ liệu trong Docker volume `language_kit_pgdata`.

### Chạy cả ứng dụng và database bằng Docker

```powershell
Copy-Item .env.example .env
docker compose --profile app up --build
```

Dừng các container bằng:

```powershell
docker compose --profile app down
```

Không thêm cờ `-v` nếu muốn giữ lại dữ liệu PostgreSQL.

## Cách dùng MVP

1. Tại trang chủ, chọn preset hoặc nhập chủ đề học.
2. Chọn **Generate prompt** và sao chép prompt được tạo.
3. Gửi prompt tới một công cụ AI có khả năng trả về JSON.
4. Dán JSON thuần vào ô phản hồi; không bọc bằng Markdown code fence.
5. Chọn **Validate and save**.
6. Mở lesson vừa lưu để hoàn thành listening, roleplay, writing và retry drill.
7. Xem tổng quan tại `/dashboard` hoặc tải dữ liệu tại `/exports`.

## Lưu trữ dữ liệu hiện tại

PostgreSQL là nguồn dữ liệu chính cho lesson list, lesson detail, attempt, feedback,
retry drill, dashboard và export. UI không còn ghi song song một bản lesson khác vào
`localStorage` sau khi API lưu thành công.

Nếu lần kết nối đầu tiên trong một browser session gặp lỗi mạng hoặc lỗi server 5xx,
ứng dụng chuyển sang offline demo mode và hiện cảnh báo rõ ràng. Nguồn dữ liệu được
giữ cố định cho cả session: API mode không ghi chéo sang local store khi một mutation
thất bại, còn demo mode chỉ lưu trong browser. Chọn **Retry backend** để bắt đầu một
session kết nối mới. Lỗi request 4xx luôn được hiển thị và không kích hoạt fallback.

## Lệnh thường dùng

| Lệnh | Mục đích |
| --- | --- |
| `pnpm dev` | Chạy development server |
| `pnpm build` | Tạo production build |
| `pnpm start` | Chạy production build |
| `pnpm check` | Chạy file-size guard, typecheck và test |
| `pnpm check:file-size` | Chặn file mới quá 300 dòng hoặc file legacy tiếp tục phình |
| `pnpm typecheck` | Kiểm tra TypeScript |
| `pnpm test` | Chạy unit và integration tests mặc định |
| `pnpm test:unit` | Chạy unit tests |
| `pnpm test:integration` | Chạy integration tests không yêu cầu DB thật |
| `pnpm test:coverage` | Chạy test với ngưỡng coverage 80% |
| `pnpm test:e2e` | Chạy Playwright trên Chromium |
| `pnpm db:up` | Khởi động PostgreSQL |
| `pnpm db:generate` | Tạo migration từ schema |
| `pnpm db:migrate` | Áp dụng migration |
| `pnpm db:studio` | Mở Drizzle Studio |
| `pnpm db:shell` | Mở `psql` trong container |

## Kiểm thử

Chạy bộ kiểm tra chính trước khi commit:

```powershell
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

E2E tự khởi động Next.js development server và cần PostgreSQL đang chạy:

```powershell
pnpm db:up
pnpm db:migrate
pnpm test:e2e
```

Kiểm thử repository với PostgreSQL thật là opt-in:

```powershell
$env:RUN_DB_TESTS="1"
$env:DATABASE_URL="postgres://language_kit:language_kit@localhost:54320/language_kit_dev"
pnpm vitest run tests/integration/repository-postgres.test.ts
```

## API chính

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| `GET` | `/api/health` | Kiểm tra service và cấu hình database |
| `GET`, `POST` | `/api/lesson-packs` | Liệt kê hoặc kiểm tra và lưu lesson pack |
| `GET` | `/api/lesson-packs/:id` | Đọc lesson detail và lịch sử luyện tập |
| `GET` | `/api/dashboard` | Đọc tổng hợp tiến độ từ PostgreSQL |
| `POST` | `/api/listening-attempts` | Lưu kết quả luyện nghe |
| `POST` | `/api/feedback` | Kiểm tra, lưu và trả lại feedback có cấu trúc |
| `POST` | `/api/retry-drills/:id/complete` | Hoàn thành retry drill |
| `GET` | `/api/exports/:kind` | Tải dataset JSONL |

### Payload notes

- `POST /api/listening-attempts`: client sends `lessonPackId`, learner answers,
  `scoreGist`, `scoreDetail`, `scoreKeyPhrase`, `replayCount`, and
  `missedDetails`. The server derives `listeningInputId`; `scoreOverall` and
  transcript unlock are UI-derived state and are not persisted.
- `POST /api/feedback`: manual relay accepts plain JSON or one code fence that
  wraps the whole feedback JSON. The raw AI output is still saved unchanged, and
  the parsed object must pass `feedback.v1` validation before any error/retry
  records are inserted.
- `lesson_pack.v1` remains strict: lesson-generation output should be pasted as
  plain JSON, not Markdown-wrapped JSON.

Các loại export hợp lệ:

- `lesson_generation_sft`
- `feedback_scoring_sft`
- `error_classification`
- `retry_generation_sft`
- `json_repair_sft`

## Cấu trúc thư mục

```text
app/                 Next.js pages và API routes
scripts/             Repository quality checks
src/components/      Giao diện và luồng tương tác phía client
src/demo/            Dữ liệu demo dùng chung cho sản phẩm và tests
src/db/              Drizzle schema, client và repository
src/lib/             Data contracts, prompt, scoring và export
drizzle/             SQL migrations
tests/               Unit, integration và E2E tests
docs/                Product brief, scope, contracts và kế hoạch MVP
tooling/             Baseline chất lượng và agent guidance
public/               Static assets
```

## Tài liệu thiết kế

Bắt đầu từ [`docs/README.md`](docs/README.md), sau đó đọc theo thứ tự:

1. Product brief và phạm vi MVP.
2. Luồng học listening-first.
3. Các chế độ thực thi AI.
4. Data contracts và data model.
5. Kế hoạch build và acceptance test.

Hai tài liệu nền tảng của dự án là:

- [`docs/research/listening-first-language-practice.md`](docs/research/listening-first-language-practice.md)
- [`docs/research/budget-constrained-architecture.md`](docs/research/budget-constrained-architecture.md)

## Giới hạn MVP

- Không tự động điều khiển hoặc scrape các website AI miễn phí.
- Chưa có authentication hay multi-user isolation.
- Roleplay hiện là text; chưa có ASR, TTS hoặc chấm phát âm.
- Listening dùng heuristic so khớp từ khóa; đây chưa phải chấm ngữ nghĩa bằng AI.
- Browser demo store là fallback tách biệt theo session và không đồng bộ ngược lên PostgreSQL.
- Chưa có fine-tuning; JSONL chỉ chuẩn bị dữ liệu cho phân tích hoặc huấn luyện về sau.
