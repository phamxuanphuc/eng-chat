# Kế Hoạch Triển Khai Chi Tiết Toàn Bộ Dự Án (TASKS.md)

Tài liệu này theo dõi chi tiết toàn bộ các task kỹ thuật, tiêu chuẩn kiểm thử và trạng thái thực thi cho tất cả 8 giai đoạn của dự án EngChat AI.

---

## 1. Bảng Phân Rã Công Việc Toàn Bộ Dự Án (WBS)

### Giai đoạn 1: Core Foundation & Mock Data
- [x] **Task 1.1**: Định nghĩa hệ thống Type Definitions (`src/types/index.ts`): Tones, AppSettings, ChatMessage, TranslateExplainResult, Messages.
- [x] **Task 1.2**: Xây dựng Mock Data tách biệt (`tests/mocks/settings.mock.ts`, `tests/mocks/gemini.mock.ts`) theo Rule 4.

### Giai đoạn 2: Bộ UI Kit Chuẩn Hóa (Uiverse Galaxy)
- [x] **Task 2.1**: `src/components/ui/Button.tsx` (Hiệu ứng glow gradient viền neon, variants `primary`, `secondary`, `ghost`, `danger`, `isLoading`).
- [x] **Task 2.2**: `src/components/ui/Input.tsx` (Ô nhập kính mờ viền neon, nút mắt ẩn/hiện API Key, error message).
- [ ] **Task 2.3**: `src/components/ui/Textarea.tsx` (Đồng bộ glow ring với Input, hỗ trợ auto-resize).
- [ ] **Task 2.4**: `src/components/ui/Switch.tsx` (Toggle switch Uiverse Galaxy chuyển động mượt mà cho Chat Context).
- [ ] **Task 2.5**: `src/components/ui/Loader.tsx` (Galaxy orbital dual-ring spinner cho trạng thái xử lý).
- [ ] **Task 2.6**: `src/components/ui/ToneCard.tsx` (Interactive card với hiệu ứng phát sáng viền gradient khi được chọn).
- [ ] **Task 2.7**: `src/components/ui/Alert.tsx` (Glass notification card thông báo kết quả thành công/thất bại).
- [ ] **Task 2.8**: Unit test toàn bộ UI components (`tests/ui-components.test.tsx`).

### Giai đoạn 3: State Management & Storage Service
- [ ] **Task 3.1**: `src/services/storage.ts` (Wrapper CRUD an toàn cho `chrome.storage.sync` và fallback `local`).
- [ ] **Task 3.2**: `src/store/useSettingsStore.ts` (Zustand Store đồng bộ state 2 chiều tự động với `chrome.storage`).
- [ ] **Task 3.3**: Unit test lưu trữ và đồng bộ (`tests/storage.test.ts`).

### Giai đoạn 4: Gemini AI Engine & Prompt Builder
- [ ] **Task 4.1**: `src/services/prompt.ts` (Prompt Builder: 4 văn phong, trích xuất context chat, và chế độ Dịch & Giải thích).
- [ ] **Task 4.2**: `src/services/gemini.ts` (Axios Client gọi Gemini REST API, interceptor, timeout 10s, parse JSON và chuẩn hóa mã lỗi).
- [ ] **Task 4.3**: Unit test Prompt Builder (`tests/prompt.test.ts`).
- [ ] **Task 4.4**: Unit test Gemini API Service (`tests/gemini.test.ts`).

### Giai đoạn 5: DOM Utilities, Chat Extractor & Shadow DOM UI
- [ ] **Task 5.1**: `src/content/chat-extractor.ts` (DOM Heuristic trích xuất 3-5 tin nhắn liền trước từ khung chat Slack/Discord/Teams).
- [ ] **Task 5.2**: `src/content/dom-utils.ts` (Nhận diện `<input>`, `<textarea>`, `contenteditable`, thay thế text an toàn, dispatch `input`/`change`).
- [ ] **Task 5.3**: `src/content/ui/TooltipApp.tsx` (React Shadow DOM Tooltip: Loader, xem trước bản dịch, nút Copy/Replace, thẻ giải thích).
- [ ] **Task 5.4**: `src/content/index.ts` (Content Script điều phối, lắng nghe message từ Background).
- [ ] **Task 5.5**: Unit test DOM Utils & Chat Extractor (`tests/chat-extractor.test.ts`, `tests/dom-utils.test.ts`).

### Giai đoạn 6: Background Service Worker & Context Menu
- [ ] **Task 6.1**: `src/background/index.ts` (Đăng ký context menu đa cấp theo tone khi cài đặt extension).
- [ ] **Task 6.2**: Điều phối sự kiện click menu, gọi Gemini API và gửi kết quả về Content Script.
- [ ] **Task 6.3**: Unit test Background Worker listener (`tests/background.test.ts`).

### Giai đoạn 7: Giao Diện Options & Popup (React + React Query)
- [ ] **Task 7.1**: `src/options/App.tsx` (Màn hình cài đặt: nhập API Key, test connection qua React Query mutation, chỉnh văn phong, toggle chat context).
- [ ] **Task 7.2**: `src/popup/App.tsx` (Màn hình Popup nhanh: kiểm tra trạng thái API, chọn văn phong và dịch nhanh tại chỗ).
- [ ] **Task 7.3**: Thiết lập file HTML entry points (`src/options/index.html`, `src/popup/index.html`).

### Giai đoạn 8: Kiểm Thử Toàn Diện, Build & Đóng Gói Tiện Ích
- [ ] **Task 8.1**: Chạy toàn bộ test suite (`pnpm test`) - Đạt 100% pass.
- [ ] **Task 8.2**: Biên dịch production (`pnpm build`) - Kiểm tra bundle ra thư mục `dist/` không lỗi TypeScript.
- [ ] **Task 8.3**: Kiểm thử E2E thực tế trên trình duyệt Chrome và nghiệm thu theo [Agents.md](file:///Users/phucpham/Desktop/game/eng-chat/Agents.md).

---

## 2. Tiêu Chí Nghiệm Thu Từng Giai Đoạn (Milestone DoD)
1. **Milestone 1**: Types & Mocks độc lập, không có lỗi type-check.
2. **Milestone 2**: 100% UI tuân thủ chuẩn Uiverse Galaxy, test render thành công.
3. **Milestone 3**: Cấu hình lưu trữ và đồng bộ thông suốt với storage.
4. **Milestone 4**: Gemini API xử lý đúng prompt văn bản sạch và JSON giải thích, bắt lỗi 401/429.
5. **Milestone 5**: Thao tác DOM chèn text mượt mà, không xung đột CSS nhờ Shadow DOM.
6. **Milestone 6**: Menu chuột phải phản hồi chính xác mọi ngữ cảnh.
7. **Milestone 7**: Giao diện Options và Popup hoàn chỉnh, thẩm mỹ cao.
8. **Milestone 8**: 100% Unit test pass, build `dist/` thành công.
