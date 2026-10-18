# Tài Liệu Yêu Cầu Sản Phẩm (PRD) - LingoFlow

## 1. Tổng Quan Sản Phẩm
LingoFlow ("Write, Rewrite & Translate Anywhere") là tiện ích Chrome Manifest V3 giúp người dùng **cải thiện, viết lại, tóm tắt và dịch** văn bản ngay trên bất kỳ trang web nào, bằng API key của chính họ: Google Gemini hoặc bất kỳ nhà cung cấp tương thích OpenAI (OpenAI, OpenRouter, Groq, Ollama, LM Studio,...).

---

## 2. Mục Tiêu & Giá Trị Cốt Lõi
- **Tiện lợi**: Xử lý văn bản ngay tại vị trí đang gõ/đọc qua thanh công cụ nổi, menu chuột phải hoặc phím tắt, không cần chuyển tab.
- **Đa ngôn ngữ đầu ra**: Mỗi chế độ có ngôn ngữ đích riêng (ví dụ: Rewrite → English, Translate → Tiếng Việt).
- **Linh hoạt văn phong**: Nhiều phong cách giao tiếp, tùy chỉnh độ dài/định dạng và prompt riêng.
- **Riêng tư**: Dùng API key của người dùng, gọi trực tiếp tới nhà cung cấp AI, không qua server trung gian.

---

## 3. Các Tính Năng Chính

### 3.1. Chế Độ Xử Lý & Ngôn Ngữ Đầu Ra
| Chế độ | Mô tả | Ngôn ngữ mặc định |
|---|---|---|
| Improve | Sửa ngữ pháp, làm câu tự nhiên hơn | English |
| Rewrite | Viết lại theo văn phong, độ dài, định dạng đã chọn | English |
| Summary | Tóm tắt nội dung được chọn | Vietnamese |
| Translate | Dịch kèm giải thích từ vựng/ngữ pháp | Vietnamese |

- Ngôn ngữ hỗ trợ: English, Vietnamese, Japanese, Korean, Chinese, French, Spanish, German.
- Ngôn ngữ đích được chọn **theo từng chế độ**, đổi được ngay trong popup kết quả (kết quả tự tạo lại) hoặc trong trang cài đặt; lưu tại `chrome.storage.local` (`engchat_target_languages`) và đồng bộ tức thì tới các tab đang mở.

### 3.2. Điểm Kích Hoạt
- **Thanh công cụ nổi (Floating Toolbar)**: Hiện khi bôi đen văn bản hoặc focus ô nhập liệu (`input`, `textarea`, `contenteditable`).
- **Menu chuột phải**: `LingoFlow` → Improve / Rewrite / Translate.
- **Phím tắt**: `Ctrl+Shift+E` (`Cmd+Shift+E` trên macOS) tối ưu văn bản với văn phong mặc định.

### 3.3. Popup Kết Quả (Shadow DOM)
- Đổi chế độ, đổi ngôn ngữ đích, tạo lại kết quả, hỏi tiếp (follow-up) và đổi model ngay trong popup.
- Thay thế trực tiếp vào ô nhập liệu (kích hoạt sự kiện DOM chuẩn, tương thích Gmail, Slack, Notion,...) hoặc sao chép kết quả.
- Có thể kéo thả, tự theo theme sáng/tối của trang web, nút bánh răng mở trang cài đặt.
- Hiển thị trạng thái đang xử lý và thông báo lỗi rõ ràng (sai key, hết quota, mất mạng).

### 3.4. Văn Phong
- Polite & Formal, Professional & Business, Friendly & Natural, Concise & Direct, Translate & Explain.
- Prompt tùy chỉnh cho từng văn phong; tùy chọn độ dài/định dạng khi Rewrite.

### 3.5. Nhà Cung Cấp AI
- **Google Gemini**: Nhiều API key có nhãn, tự luân phiên key khi gặp lỗi 429/401/403, kiểm tra kết nối, chọn model (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`). API key chỉ gửi qua header.
- **OpenAI-compatible**: Base URL, API key, tải danh sách model qua service worker.

### 3.6. Ngữ Cảnh Hội Thoại (Chat Context)
- Tùy chọn đọc 1–10 tin nhắn gần nhất (Slack, Discord, MS Teams,...) để AI chọn xưng hô và giọng điệu phù hợp. Tắt tính năng thì không có dữ liệu hội thoại nào được gửi đi.

### 3.7. Trang Cài Đặt (Options)
- 3 tab: **AI Provider**, **Writing settings** (văn phong mặc định, prompt tùy chỉnh, ngôn ngữ đầu ra theo chế độ), **Context**.
- Header gọn: chọn ngôn ngữ giao diện (EN/VI) và nút giao diện **System / Light / Dark** (lưu trong `localStorage`, áp dụng cho trang cài đặt và popup của tiện ích).
- Thanh "Lưu cài đặt" luôn hiển thị ở cuối màn hình; báo thành công/lỗi rõ ràng.
- Đạt độ tương phản chữ WCAG AA ở cả hai theme, không tràn ngang trên màn hình hẹp.

### 3.8. Lưu Trữ & Bảo Mật
- Cài đặt lưu ở `chrome.storage.local` (ưu tiên) và `chrome.storage.sync`, có dự phòng `localStorage`.
- Không có server trung gian; quyền host rộng chỉ để chèn content script và gọi tới base URL tùy chỉnh.

---

## 4. Trạng Thái & Lộ Trình
- [x] Khung dự án Vite + React + crxjs, Manifest V3.
- [x] Gemini và OpenAI-compatible, đa key, luân phiên key.
- [x] Thanh công cụ nổi, menu chuột phải, phím tắt, popup kết quả.
- [x] 4 chế độ với ngôn ngữ đầu ra theo từng chế độ.
- [x] Ngữ cảnh hội thoại, giao diện song ngữ EN/VI.
- [x] Theme sáng/tối/hệ thống cho trang cài đặt.
- [x] Unit/integration test (Vitest) và kiểm thử E2E trên Chromium thật.
- [ ] Mở rộng danh sách ngôn ngữ đích; đồng bộ theme cài đặt với popup trên trang web.
