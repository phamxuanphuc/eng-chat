# Thiết Kế Kỹ Thuật (Technical Specification) - VinaWrite

Tài liệu này đề xuất giải pháp kiến trúc và kỹ thuật để triển khai Chrome Extension VinaWrite theo chuẩn Manifest V3.

---

## 1. Công Nghệ Đề Xuất (Tech Stack)

| Thành phần | Lựa chọn công nghệ | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Ngôn ngữ** | TypeScript (Strict mode) | Đảm bảo an toàn kiểu dữ liệu, giảm thiểu bug khi thao tác Chrome APIs và DOM. |
| **Giao diện (UI)** | React 18 | Xây dựng UI linh hoạt, module hóa cho Popup, Options và Tooltip trong Shadow DOM. |
| **State Management** | Zustand | State management siêu nhẹ (~1KB), cú pháp đơn giản, đồng bộ mượt mà với `chrome.storage`. |
| **Data Fetching** | TanStack React Query | Quản lý async state, mutation, retry và caching cho kiểm tra API key và gọi tối ưu text. |
| **HTTP Client** | Axios | Client gửi HTTP request chuẩn hóa, xử lý timeout, interceptor và bắt lỗi chi tiết từ Gemini API. |
| **Styling & UI Kit** | Tailwind CSS + Uiverse Galaxy | Thiết kế UI hiện đại, áp dụng các UI elements phong cách Uiverse Galaxy (button, switch, input, loader, cards). |
| **Công cụ Build** | Vite + Rollup | Tốc độ build siêu nhanh, hỗ trợ đa entrypoint cho Manifest V3 (background, content, popup, options). |
| **UI Injection** | Shadow DOM | Cách ly 100% CSS (kèm Tailwind reset/utility) với CSS của trang web đích (tránh xung đột style). |
| **Kiểm thử (Test)** | Vitest + Happy-DOM | Tương thích trực tiếp với Vite, chạy cực nhanh, hỗ trợ test logic DOM và Service Worker. |

---

## 2. Kiến Trúc Hệ Thống (Manifest V3 Architecture)

```
[Người Dùng]
    │ (Click Context Menu hoặc Phím tắt)
    ▼
[Background Service Worker]
    │ 1. Gửi lệnh thu thập dữ liệu
    ▼
[Content Script (Trang Web)]
    │ 2. Lấy Text + Chat Context (nếu có)
    │ 3. Hiển thị Loading Indicator (Shadow DOM)
    │ 4. Gửi payload về Background
    ▼
[Background Service Worker]
    │ 5. Đọc API Key từ chrome.storage
    │ 6. Gửi request tới Google Gemini API
    │ 7. Nhận văn bản tối ưu, trả về Content Script
    ▼
[Content Script]
    │ 8. Tự động thay thế vào ô nhập liệu HOẶC hiện Tooltip Preview
```

---

## 3. Thiết Kế Các Module Chính

### 3.1. Dịch Vụ Lưu Trữ (`src/services/storage.ts`)
- Sử dụng `chrome.storage.sync` (hoặc `chrome.storage.local` khi dữ liệu lớn).
- Schema cấu hình:
  - `geminiApiKey`: Chuỗi khóa API chính.
  - `apiKeys`: Mảng các đối tượng khóa `Array<{ id: string; label: string; key: string }>`.
  - `autoRotateKeys`: `boolean` (mặc định: `true`) - Tự động luân phiên sang khóa tiếp theo khi gặp 429 / 401 / 403.
  - `selectedModel`: `gemini-2.0-flash` (mặc định), `gemini-1.5-flash`,...
  - `defaultTone`: `polite` | `professional` | `friendly` | `concise` | `translate_explain`.
  - `enableChatContext`: `boolean` (mặc định: `true`).
  - `maxContextMessages`: `number` (3 - 5 tin nhắn).

### 3.2. Dịch Vụ Gemini AI (`src/services/gemini.ts`)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Cơ chế Failover đa khóa (Multi-Key Failover)**:
  - Nạp danh sách ứng viên khóa từ `extractCandidateKeys(settings)`.
  - Khi khóa đang gọi trả về lỗi 429 (Resource Exhausted) hoặc 401/403, tự động chuyển sang khóa dự phòng kế tiếp nếu `autoRotateKeys` được bật.
- **System Instruction**:
  - *Chế độ tối ưu văn phong*: Áp dụng văn phong chỉ định (`polite`, `professional`, `friendly`, `concise`), sử dụng context chat nếu có, chỉ trả về văn bản kết quả thuần túy không kèm giải thích.
  - *Chế độ Dịch & Giải thích (`translate_explain`)*: Trả về kết quả có cấu trúc gồm: Bản dịch chính xác + Phân tích từ vựng trọng tâm + Giải thích ngữ pháp và sắc thái biểu đạt.


### 3.3. Background Service Worker (`src/background/index.ts`)
- Khởi tạo `chrome.contextMenus` đa cấp khi cài đặt extension:
  - Menu cha: "VinaWrite"
  - Các menu con: Improve, Rewrite, Summary, Translate.
- Điều phối luồng xử lý giữa Content Script và nhà cung cấp AI (Gemini hoặc OpenAI-compatible); kết quả dạng văn bản đi qua cổng `engchat_stream` (SSE) để hiển thị dần. Khi vừa cài đặt (`reason === 'install'`) tự mở trang cài đặt.

### 3.4. Content Script & DOM Manipulation (`src/content/index.ts`)
- **Phát hiện ô nhập liệu**:
  - Hỗ trợ `<input type="text">`, `<textarea>`.
  - Hỗ trợ Rich-text `[contenteditable="true"]` (Gmail compose, Slack message input, Discord editor).
- **Cơ chế ghi đè an toàn (Event Emulation)**:
  - Gán giá trị mới kết hợp dispatch các sự kiện: `beforeinput`, `input`, `change` để các framework hiện đại (React, Vue) nhận diện được sự thay đổi trạng thái (state).
- **Giao diện Shadow DOM (`src/content/ui/`)**:
  - Tạo `div` gắn `attachShadow({ mode: 'open' })`.
  - Nhúng Loading Spinner và Floating Preview Tooltip độc lập hoàn toàn với trang web.

### 3.5. Trích Xuất Ngữ Cảnh Hội Thoại (`src/content/chat-extractor.ts`)
- **Chiến lược quét DOM**:
  - Xác định container chứa tin nhắn gần nhất dựa trên các thuộc tính phổ biến: `[role="log"]`, `[aria-live]`, các container cuộn (scrollable container) gần ô input đang focus.
  - Bộ selector chuyên biệt cho các nền tảng thông dụng: Slack (`.c-virtual_list__scroll_container`), Discord (`[data-list-id="chat-messages"]`), Messenger, Teams.
  - Thu thập tối đa 3-5 tin nhắn gần nhất, loại bỏ timestamp và icon, chỉ lấy nội dung thuần.

---

## 4. Cấu Trúc Thư Mục Dự Án (Project Structure)

```
eng-chat/
├── src/
│   ├── background/        # Service Worker, Context Menu, cổng streaming
│   │   └── index.ts, stream-port.ts
│   ├── components/ui/     # UI Elements phong cách Uiverse Galaxy
│   │   └── Alert, Badge, Button, Chip, IconButton, Input, Loader, Logo,
│   │       Menu, Select, SelectCard, Switch, Textarea, ToneCard
│   ├── content/           # Content Script tương tác DOM
│   │   ├── index.tsx, content-events.ts, content-state.ts, optimize-actions.ts
│   │   ├── stream-client.ts, overlay-prefs.ts, dom-utils.ts, edit-target.ts
│   │   └── ui/            # React + Shadow DOM
│   │       ├── ContentOverlay.tsx, FloatingToolbar.tsx, TranslatePopup.tsx
│   │       ├── PopupResult.tsx, DiffView.tsx, NativeTranslationSection.tsx
│   │       └── RewriteOptionsPanel.tsx, ModelPicker.tsx, LanguageMenu.tsx
│   ├── options/           # Trang cài đặt, 4 tab: AI Provider, Writing, Context, Hidden sites
│   │   ├── App.tsx, OptionsLayout.tsx, OptionsContext.tsx
│   │   └── pages/
│   ├── popup/             # Giao diện popup nhanh
│   ├── services/          # Gọi AI, lưu trữ, prompt
│   │   ├── gemini.ts, openai.ts, stream.ts, optimize-stream.ts
│   │   ├── key-cooldown.ts, api-error.ts, text-diff.ts
│   │   └── storage.ts, prompt.ts
│   ├── store/             # Zustand store đồng bộ chrome.storage
│   │   └── useSettingsStore.ts
│   └── types/             # Định nghĩa Type / Interface
├── tests/                 # Unit & integration tests (Vitest), mock tại tests/mocks/
├── manifest.json          # Manifest V3 configuration
├── tailwind.config.js     # Cấu hình Tailwind CSS
├── postcss.config.js      # Cấu hình PostCSS
├── vite.config.ts         # Cấu hình đóng gói extension
└── tsconfig.json
```

---

## 5. Quy Trình Kiểm Thử & Xác Thực (Theo Agents.md)
1. **Unit Test**: Kiểm thử logic build prompt, parse phản hồi Gemini, và logic trích xuất text từ DOM giả lập (Happy-DOM).
2. **E2E Manual Verification**: Kiểm thử thực tế trên 3 môi trường:
   - Form thông thường (Google Search, form HTML chuẩn).
   - Rich-text editor (Gmail web compose).
   - Web chat app (Slack web hoặc Discord web).
