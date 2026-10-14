# Kế Hoạch Triển Khai Kỹ Thuật Chi Tiết (TASKS.md)

Tài liệu này đặc tả chi tiết kiến trúc, giao thức truyền tin, thuật toán xử lý DOM, kịch bản kiểm thử và tiêu chuẩn nghiệm thu cho EngChat AI.

---

## 1. Đặc Tả Giao Thức & Kỹ Thuật Cốt Lõi

### 1.1. Giao Thức Chrome Runtime Messaging
| Action Name | Sender -> Receiver | Payload | Response |
| :--- | :--- | :--- | :--- |
| `TRIGGER_OPTIMIZE` | Background -> Content | `{ tone: ToneType }` | `{ success: boolean, hasSelection: boolean }` |
| `EXECUTE_GEMINI` | Content -> Background | `{ text: string, tone: ToneType, context?: ChatMessage[] }` | `OptimizeResponse` |
| `GET_SETTINGS` | Any -> Background | `null` | `AppSettings` |
| `SAVE_SETTINGS` | Options/Popup -> Background | `Partial<AppSettings>` | `{ success: boolean }` |

### 1.2. Chiến Lược Ghi Đè DOM & Giả Lập Sự Kiện
- **Native Input/Textarea**: Sử dụng `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set` để vượt qua Virtual DOM setter của React, sau đó dispatch chuỗi sự kiện: `beforeinput` -> `input` (bubbles: true) -> `change`.
- **Rich-text (`contenteditable`)**: Sử dụng `Selection` API và `document.execCommand('insertText', false, text)` để bảo toàn undo/redo stack của trình duyệt.
- **Shadow DOM Overlay**: Tạo custom container `<div id="engchat-root">` gắn `attachShadow({ mode: 'open' })` để cô lập hoàn toàn CSS khỏi trang chủ.

---

## 2. Danh Sách Tasks Chi Tiết (Work Breakdown Structure)

### Giai đoạn 1: Core Foundation & Mock Data
- [x] **Task 1.1**: Định nghĩa Types (`src/types/index.ts`): `ToneType`, `AppSettings`, `ChatMessage`, `TranslateExplainResult`, `OptimizeResponse`.
- [x] **Task 1.2**: Tách biệt Mock Data (`tests/mocks/settings.mock.ts`, `tests/mocks/gemini.mock.ts`).

### Giai đoạn 2: UI Kit Chuẩn Hóa Uiverse Galaxy (`src/components/ui/`)
- [x] **Task 2.1**: `Button.tsx` (Glow gradient, variants: `primary`, `secondary`, `ghost`, `danger`, `isLoading`, active scaling).
- [x] **Task 2.2**: `Input.tsx` (Glass input, cyber glow ring, nút ẩn/hiện mật khẩu, error handling).
- [x] **Task 2.3**: `Textarea.tsx` (Đồng bộ glow ring, không resize vỡ layout).
- [x] **Task 2.4**: `Switch.tsx` (Spring toggle switch cho Chat Context).
- [x] **Task 2.5**: `Loader.tsx` (Galaxy dual-ring orbital spinner).
- [x] **Task 2.6**: `ToneCard.tsx` (Card văn phong với viền gradient active).
- [x] **Task 2.7**: `Alert.tsx` (Glass notification card với viền dạ quang cho `success`, `error`, `info`).
- [x] **Task 2.8**: Unit test toàn diện cho UI Kit (`tests/ui-components.test.tsx`).

### Giai đoạn 3: State Management & Storage Service
- [x] **Task 3.1**: `src/services/storage.ts`:
  - `loadSettings()`: Đọc từ `chrome.storage.sync`, fallback giá trị mặc định.
  - `saveSettings(settings)`: Ghi đè cấu hình mới an toàn.
- [x] **Task 3.2**: `src/store/useSettingsStore.ts`:
  - Zustand Store quản lý state cài đặt, tự động sync khi storage thay đổi.
- [x] **Task 3.3**: Unit test storage & store (`tests/storage.test.ts`).

### Giai đoạn 4: Gemini AI Engine & Prompt Builder
- [ ] **Task 4.1**: `src/services/prompt.ts`:
  - `buildSystemInstruction(tone)`: System prompt nghiêm ngặt cho từng tone.
  - `buildUserPrompt(text, contextMessages)`: Định dạng prompt sạch hoặc prompt JSON schema.
- [ ] **Task 4.2**: `src/services/gemini.ts`:
  - Axios instance cấu hình baseURL, timeout 10000ms.
  - Xử lý mã lỗi HTTP 400 (Bad request), 401/403 (Invalid key), 429 (Rate limit).
  - Parse JSON kết quả cho chế độ `translate_explain`.
- [ ] **Task 4.3**: Unit tests Prompt Builder & Gemini Client (`tests/prompt.test.ts`, `tests/gemini.test.ts`).

### Giai đoạn 5: DOM Utilities, Chat Extractor & Shadow DOM UI
- [ ] **Task 5.1**: `src/content/chat-extractor.ts`:
  - Thuật toán trích xuất 3-5 tin nhắn: Quét container cuộn gần nhất, trích xuất text thuần loại bỏ timestamp/avatar.
- [ ] **Task 5.2**: `src/content/dom-utils.ts`:
  - `getActiveEditableElement()`: Xác định element đang focus.
  - `replaceTextInElement(el, newText)`: Ghi đè an toàn kèm event dispatch.
- [ ] **Task 5.3**: `src/content/ui/TooltipApp.tsx`:
  - Render trong Shadow DOM: Hiển thị Galaxy Loader, kết quả xem trước, nút Sao chép, nút Chèn và thẻ giải thích từ vựng/ngữ pháp.
- [ ] **Task 5.4**: `src/content/index.ts`: Lắng nghe message và điều phối luồng.
- [ ] **Task 5.5**: Unit test DOM Utils & Chat Extractor (`tests/chat-extractor.test.ts`).

### Giai đoạn 6: Background Service Worker & Context Menu
- [ ] **Task 6.1**: `src/background/index.ts`:
  - `chrome.runtime.onInstalled`: Tạo menu cha "EngChat AI" và 5 menu con tương ứng 5 tone.
  - `chrome.contextMenus.onClicked`: Bắt sự kiện, điều phối gửi message tới active tab.
- [ ] **Task 6.2**: Unit test Background Worker (`tests/background.test.ts`).

### Giai đoạn 7: Giao Diện Options & Popup (React + React Query)
- [ ] **Task 7.1**: `src/options/App.tsx`: Form cấu hình API Key, chọn model, test connection via React Query `useMutation`, switch chat context.
- [ ] **Task 7.2**: `src/popup/App.tsx`: Quick panel tra cứu trạng thái kết nối, dịch nhanh.
- [ ] **Task 7.3**: HTML entrypoints (`src/options/index.html`, `src/popup/index.html`).

### Giai đoạn 8: Kiểm Thử Toàn Diện, Build & E2E Verification
- [ ] **Task 8.1**: Toàn bộ unit tests pass 100% (`pnpm test`).
- [ ] **Task 8.2**: Biên dịch production (`pnpm build`) sạch, không lỗi type-check.
- [ ] **Task 8.3**: Kiểm tra E2E thực tế trên Google Forms, Gmail Web, Slack Web theo [Agents.md](file:///Users/phucpham/Desktop/game/eng-chat/Agents.md).

---

## 3. Ma Trận Test Cases Bắt Buộc Phải Pass

| Test ID | Module | Kịch bản kiểm thử | Kỳ vọng đầu ra |
| :--- | :--- | :--- | :--- |
| **TC-PR-01** | `prompt.ts` | Build prompt với tone `polite` | Không có câu chào thừa, hướng dẫn văn phong lịch sự |
| **TC-PR-02** | `prompt.ts` | Tích hợp 3 tin nhắn chat context | Đoạn hội thoại được đưa vào mục Context trước câu hỏi |
| **TC-PR-03** | `prompt.ts` | Chế độ `translate_explain` | Yêu cầu trả về JSON schema chuẩn với translation & explanation |
| **TC-GM-01** | `gemini.ts` | Gọi API với API key hợp lệ | Trả về text tiếng Anh sạch sẽ |
| **TC-GM-02** | `gemini.ts` | Gọi API với mã lỗi 401 | Báo lỗi "API Key không hợp lệ" |
| **TC-GM-03** | `gemini.ts` | Gọi API với mã lỗi 429 | Báo lỗi "Đã vượt hạn mức (Quota exceeded)" |
| **TC-GM-04** | `gemini.ts` | Parse phản hồi JSON hợp lệ | Trả về object `TranslateExplainResult` đầy đủ trường |
| **TC-ST-01** | `storage.ts` | Đọc storage khi chưa có dữ liệu | Trả về giá trị mặc định cấu hình an toàn |
| **TC-ST-02** | `storage.ts` | Cập nhật API key mới | Dữ liệu được ghi vào storage thành công |
| **TC-DM-01** | `dom-utils.ts`| Thay thế text trên `<input>` | Value thay đổi và kích hoạt event `input`, `change` |
| **TC-DM-02** | `dom-utils.ts`| Thay thế text trên `contenteditable` | Nội dung text trong node được cập nhật chính xác |
| **TC-UI-01** | `Button.tsx` | Click button khi đang `isLoading` | Không kích hoạt sự kiện click, hiển thị spinner |
| **TC-UI-02** | `Switch.tsx` | Click toggle switch | Giá trị boolean đảo chiều và kích hoạt `onChange` |

---

## 4. Tiêu Chuẩn Nghiệm Thu & Kiểm Soát Chất Lượng (DoD)
1. **Kiểm thử tự động**: 100% các test case ở mục 3 phải pass trên Vitest (`pnpm test`).
2. **Tuân thủ UI Uiverse Galaxy**: Không sử dụng CSS thô hoặc component ngoài `src/components/ui/`.
3. **Giới hạn tệp**: Toàn bộ các file mã nguồn mới phải dưới 250 dòng.
4. **Cô lập mã**: Không chứa mock data trong source code logic, tách biệt hoàn toàn tại `tests/mocks/`.
