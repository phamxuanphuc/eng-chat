# T6. Chỉ hiện thanh Lưu khi cần

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** Trong `src/options/OptionsLayout.tsx`, `showSaveBar = pathname !== '/sites' || isDirty`. Thanh "Đã lưu tất cả" luôn nổi ở 3 trên 4 trang và che cuối nội dung.

**Cần làm:**
1. Đổi thành `showSaveBar = isDirty || saveSuccess || saveError || permissionDenied`.
2. Bỏ nhánh trạng thái `isReady` ("All changes saved") trong biến `status`. Xóa key `options.allSaved` ở cả hai file i18n nếu không còn nơi nào dùng.
3. Nút Lưu luôn là `variant="primary"` vì thanh chỉ hiện khi có việc cần làm hoặc vừa lưu xong.

**Tiêu chí hoàn thành:**
- Mở trang cài đặt, chưa sửa gì: không có thanh Lưu.
- Sửa một trường: thanh hiện với "Bạn có thay đổi chưa lưu".
- Lưu xong: hiện trạng thái thành công 3 giây rồi ẩn.

**Test:** `tests/options-router.test.tsx`, `tests/ui-audit-options.test.tsx`, `tests/options-components.test.tsx` (sửa các assert cũ đang kỳ vọng thanh luôn hiện).

**Commit:** `feat: show the options save bar only when there is something to save`
