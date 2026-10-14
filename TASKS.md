# Kế Hoạch Triển Khai, Test Cases & Tiêu Chuẩn Nghiệm Thu

Tài liệu này chi tiết hóa toàn bộ các đầu việc (tasks), kịch bản kiểm thử (test cases) và điều kiện nghiệm thu (acceptance criteria) để chuẩn bị triển khai mã nguồn cho EngChat AI.

---

## 1. Danh Sách Các Task Cần Làm (Work Breakdown Structure)

### Giai đoạn 1: Core Foundation & Mock Data
- [ ] **Task 1.1**: Xây dựng hệ thống Type Definitions (`src/types/index.ts`) định nghĩa Tone, Settings, Gemini API Request/Response, ChatMessage, MessageEvent.
- [ ] **Task 1.2**: Tách biệt Mock Data phục vụ Unit Tests vào thư mục `tests/mocks/` (`settings.mock.ts`, `gemini.mock.ts`).

### Giai đoạn 2: UI Kit Chuẩn Hóa (Uiverse Galaxy)
- [ ] **Task 2.1**: `src/components/ui/Button.tsx` (Glow/Gradient button, hỗ trợ `primary`, `secondary`, `ghost`, trạng thái `isLoading`).
- [ ] **Task 2.2**: `src/components/ui/Input.tsx` & `Textarea.tsx` (Cyber glow focus ring, toggle ẩn/hiện API Key).
- [ ] **Task 2.3**: `src/components/ui/Switch.tsx` (Smooth animated toggle switch cho Chat Context).
- [ ] **Task 2.4**: `src/components/ui/Loader.tsx` (Galaxy orbital dual-ring spinner).
- [ ] **Task 2.5**: `src/components/ui/ToneCard.tsx` (Interactive card với hiệu ứng phát sáng khi active).
- [ ] **Task 2.6**: `src/components/ui/Alert.tsx` (Glass notification card với viền dạ quang thông báo lỗi/thành công).

### Giai đoạn 3: State Management & Storage Service
- [ ] **Task 3.1**: `src/services/storage.ts` (Wrapper giao tiếp an toàn với `chrome.storage.sync` / `local`).
- [ ] **Task 3.2**: `src/store/useSettingsStore.ts` (Zustand Store đồng bộ cấu hình tự động với storage).

### Giai đoạn 4: Gemini API Client & Prompt Builder
- [ ] **Task 4.1**: `src/services/prompt.ts` (Bộ xây dựng prompt cho 4 văn phong, prompt kèm ngữ cảnh chat, và prompt cho chế độ Dịch & Giải thích).
- [ ] **Task 4.2**: `src/services/gemini.ts` (Axios Client gọi Gemini REST API, xử lý timeout, phân tích JSON `translate_explain` và chuẩn hóa mã lỗi HTTP).

### Giai đoạn 5: Content Script, DOM Utilities & Chat Extractor
- [ ] **Task 5.1**: `src/content/chat-extractor.ts` (Module quét DOM tự động trích xuất 3-5 tin nhắn liền trước trong khung chat).
- [ ] **Task 5.2**: `src/content/dom-utils.ts` (Nhận diện `<input>`, `<textarea>`, `contenteditable`, thay thế text và dispatch sự kiện `beforeinput`, `input`, `change`).
- [ ] **Task 5.3**: `src/content/ui/TooltipApp.tsx` (Giao diện React trong Shadow DOM hiển thị Loader, bản dịch, nút Copy/Replace và thẻ giải thích).
- [ ] **Task 5.4**: `src/content/index.ts` (Content Script điều phối thao tác và lắng nghe sự kiện).

### Giai đoạn 6: Background Service Worker & Context Menu
- [ ] **Task 6.1**: `src/background/index.ts` (Đăng ký context menu đa cấp theo đúng văn phong khi cài đặt extension).
- [ ] **Task 6.2**: Xử lý sự kiện click menu, điều phối giữa Content Script và Gemini API.

### Giai đoạn 7: Giao Diện Options & Popup (React + React Query)
- [ ] **Task 7.1**: `src/options/App.tsx` (Form cấu hình API Key, chọn model, test connection bằng React Query, toggle chat context).
- [ ] **Task 7.2**: `src/popup/App.tsx` (Kiểm tra nhanh kết nối, chọn văn phong và hộp dịch nhanh).

---

## 2. Danh Sách Test Cases Bắt Buộc Phải Pass

### 2.1. Unit Test - Prompt Builder (`tests/prompt.test.ts`)
* **TC-PR-01**: Tạo prompt văn bản thuần theo từng văn phong (`polite`, `professional`, `friendly`, `concise`) không chứa text giải thích thừa.
* **TC-PR-02**: Tích hợp đúng 3-5 tin nhắn chat context vào prompt khi `enableChatContext = true`.
* **TC-PR-03**: Tạo prompt có cấu trúc JSON yêu cầu trả về bản dịch + giải thích từ vựng/ngữ pháp khi chọn `translate_explain`.

### 2.2. Unit Test - Gemini Service & Axios Client (`tests/gemini.test.ts`)
* **TC-GM-01**: Gửi request thành công và bóc tách nội dung phản hồi sạch.
* **TC-GM-02**: Bắt lỗi 401/403 (Invalid API Key) và trả về thông báo lỗi dễ hiểu.
* **TC-GM-03**: Bắt lỗi 429 (Rate Limit / Quota Exceeded) và thông báo người dùng thử lại sau.
* **TC-GM-04**: Parse chính xác cấu trúc JSON của chế độ `translate_explain`.

### 2.3. Unit Test - Storage & Zustand Store (`tests/storage.test.ts`)
* **TC-ST-01**: Tải cấu hình mặc định an toàn khi `chrome.storage` rỗng.
* **TC-ST-02**: Lưu API Key và các thiết lập mới vào storage thành công.
* **TC-ST-03**: Zustand store đồng bộ state tức thời khi storage thay đổi.

### 2.4. Unit Test - Chat Extractor & DOM Utils (`tests/chat-extractor.test.ts`)
* **TC-DM-01**: Trích xuất chính xác 3-5 tin nhắn liền trước từ cấu trúc DOM chat giả lập.
* **TC-DM-02**: Ghi đè văn bản vào `<input>` / `<textarea>` và bắn đủ các sự kiện DOM (`input`, `change`).
* **TC-DM-03**: Xử lý ghi đè an toàn trên thẻ `contenteditable`.

### 2.5. Unit Test - UI Components Uiverse Galaxy (`tests/ui-components.test.ts`)
* **TC-UI-01**: `Button` render đúng variant, kích hoạt `onClick`, hiển thị spinner khi `isLoading`.
* **TC-UI-02**: `Switch` thay đổi trạng thái và gọi callback `onChange`.
* **TC-UI-03**: `Input` hỗ trợ toggle ẩn/hiện password và hiển thị lỗi.

---

## 3. Điều Kiện Nghiệm Thu (Acceptance Criteria / Definition of Done)

1. **Chất lượng Kiểm thử (Testing QA)**:
   - 100% các bài test trong bộ test suite phải chạy thành công (`pnpm test` pass hoàn toàn).
   - Không có bất kỳ lỗi cú pháp hoặc cảnh báo kiểu dữ liệu (`pnpm build` chạy mượt mà, không lỗi TypeScript).
2. **Quy chuẩn Giao diện (UI Standards)**:
   - Toàn bộ giao diện Popup, Options và Tooltip tuân thủ nghiêm ngặt 7 UI components chuẩn hóa từ [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) trong `src/components/ui/`.
   - Không có mã CSS thô viết tùy tiện hoặc thẻ HTML trần vi phạm quy định [Agents.md](file:///Users/phucpham/Desktop/game/eng-chat/Agents.md).
3. **Trải nghiệm Người dùng Thực tế (E2E Verification)**:
   - Click chuột phải trên ô input thay thế văn bản mượt mà, không làm mất con trỏ soạn thảo.
   - Bôi đen văn bản đọc hiển thị Tooltip nổi (Shadow DOM) không làm vỡ giao diện trang web đích.
   - Chế độ Dịch & Giải thích hiển thị đầy đủ bản dịch và phân tích ngữ pháp trực quan.
4. **Tiêu chuẩn Mã nguồn**:
   - Tất cả các file mã nguồn đều dưới 250 dòng.
   - Không chứa chú thích (comments) trong source code.
   - Tách biệt hoàn toàn mock data trong thư mục `tests/mocks/`.
