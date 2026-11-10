# T12. Cho người dùng thấy ngữ cảnh hội thoại đã gửi

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** Tính năng đọc tin nhắn gần nhất bật mặc định, nhưng popup không cho biết đã gửi bao nhiêu tin nhắn cho AI.

**Cần làm:**
1. Thêm `contextCount: number` vào `TooltipState`. Trong `triggerOptimize`, đặt bằng `contextMessages.length`. `followUp` giữ nguyên giá trị.
2. Trong `TranslatePopup`, ở hàng chứa `LanguageMenu`, khi `contextCount > 0` hiện `Badge variant="secondary" size="sm"` với nội dung `content.contextUsed` (ví dụ "Ngữ cảnh: 4 tin nhắn"), có `title` là `content.contextUsedHint` giải thích có thể tắt trong cài đặt.
3. Truyền prop qua `ContentOverlay`.

**Test:** `tests/translate-popup.test.tsx`, `tests/content-script.test.ts`.

**Commit:** `feat: show how many context messages were sent`
