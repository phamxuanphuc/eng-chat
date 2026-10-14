# Tài Liệu Yêu Cầu Sản Phẩm (PRD) - EngChat AI Extension

## 1. Tổng Quan Sản Phẩm
EngChat AI là tiện ích mở rộng (Chrome Extension Manifest V3) giúp người dùng chuyển đổi và tối ưu hóa nội dung sang tiếng Anh chuẩn xác theo nhiều phong cách giao tiếp khác nhau trực tiếp trên trình duyệt, thông qua Google Gemini API cá nhân.

---

## 2. Mục Tiêu & Giá Trị Cốt Lõi
- **Tiện lợi**: Tối ưu hóa văn bản ngay tại vị trí đang gõ thông qua chuột phải hoặc phím tắt, không cần chuyển tab sang Google Translate hay ChatGPT.
- **Linh hoạt văn phong**: Hỗ trợ nhiều ngữ cảnh giao tiếp (lịch sự, công sở, thân mật, ngắn gọn).
- **Tiết kiệm & Bảo mật**: Sử dụng API Key của chính người dùng, lưu trữ trực tiếp trên trình duyệt, không thông qua server trung gian.

---

## 3. Các Tính Năng Chính (Core Features)

### 3.1. Quản Lý Cấu Hình (Settings & Options)
- Nhập và lưu trữ an toàn Gemini API Key bằng `chrome.storage.sync`.
- Chọn model Gemini (`gemini-2.0-flash`, `gemini-1.5-flash`,...).
- Nút kiểm tra kết nối (Test API Key).
- Cài đặt văn phong mặc định khi dùng phím tắt hoặc click nhanh.

### 3.2. Menu Chuột Phải (Context Menu)
- Hiển thị menu ngữ cảnh khi người dùng bôi đen đoạn văn bản hoặc click vào ô nhập liệu (`input`, `textarea`, `contenteditable`).
- Menu đa cấp lựa chọn phong cách:
  - **Lịch sự & Trang trọng (Polite & Formal)**: Dành cho email đối tác, khách hàng.
  - **Chuyên nghiệp (Professional)**: Giao tiếp công việc, tài liệu kỹ thuật.
  - **Thân thiện & Tự nhiên (Friendly & Casual)**: Trò chuyện đồng nghiệp, mạng xã hội.
  - **Ngắn gọn & Trực diện (Concise)**: Rút ngắn thông điệp, đi thẳng vào vấn đề.

### 3.3. Tương Tác Trang Web (Content Script & DOM Manipulation)
- **Tự động thay thế (Auto-replace)**: Ghi đè trực tiếp kết quả vào ô nhập liệu và kích hoạt sự kiện DOM chuẩn để tương thích với các ứng dụng web hiện đại (Gmail, Slack, Notion, Facebook,...).
- **Xem trước nổi (Floating Preview)**: Khi bôi đen văn bản đọc thuần túy, hiển thị tooltip nhỏ chứa kết quả kèm nút copy.
- **Trạng thái xử lý (Loading State)**: Hiệu ứng trực quan thông báo cho người dùng khi hệ thống đang gọi API.

### 3.4. Dịch Vụ Gemini AI (AI Engine)
- Tích hợp trực tiếp Google Gemini REST API.
- Prompt chuẩn hóa: Chỉ trả về nội dung đã dịch và chau chuốt, giữ nguyên ý nghĩa, không kèm lời giải thích thừa.
- Xử lý lỗi thân thiện: Báo lỗi rõ ràng khi sai API Key, hết quota hoặc mất kết nối mạng.

---

## 4. Hướng Đi & Lộ Trình Triển Khai (Roadmap)

### Giai đoạn 1: Khởi tạo Khung Dự án & Cấu hình (Foundation & Settings)
- Khởi tạo dự án TypeScript/Vite với Manifest V3.
- Xây dựng giao diện Options / Popup để cấu hình và kiểm tra Gemini API Key.
- Thiết lập dịch vụ lưu trữ cấu hình an toàn.

### Giai đoạn 2: Tích Hợp Context Menu & Gemini Service (MVP Flow)
- Đăng ký Context Menu đa cấp trong Background Service Worker.
- Xây dựng module kết nối Gemini API và định nghĩa prompt chuẩn.
- Thao tác DOM cơ bản: Đọc text và thay thế trong `<input>`, `<textarea>`.

### Giai đoạn 3: Hoàn Thiện Trải Nghiệm Người Dùng (UX Polish & Advanced DOM)
- Hỗ trợ các trình soạn thảo rich-text (`contenteditable`).
- Thêm Floating Preview Tooltip cho text bôi đen thông thường.
- Bổ sung hiệu ứng loading và thông báo lỗi trực quan.
- Tích hợp phím tắt nhanh (`chrome.commands`).

### Giai đoạn 4: Kiểm Thử & Tối Ưu Hóa (Testing & E2E Verification)
- Viết Unit Tests cho các module logic (Prompt builder, Storage, API Parser).
- Kiểm thử thực tế trên các trang web phổ biến (Gmail, Slack Web, GitHub, Twitter).
- Tinh chỉnh theo tiêu chuẩn [Agents.md](file:///Users/phucpham/Desktop/game/eng-chat/Agents.md) trước khi bàn giao.
