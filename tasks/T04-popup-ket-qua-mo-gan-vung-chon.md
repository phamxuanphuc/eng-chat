# T4. Popup kết quả mở gần vùng chọn thay vì góc dưới phải

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** `TranslatePopup` (`src/content/ui/TranslatePopup.tsx`) mặc định dùng class `bottom-6 right-6` khi chưa có vị trí lưu.

**Cần làm:**
1. Thêm `anchor?: { x: number; y: number } | null` vào `TooltipState` (`src/content/overlay-state.ts`) và prop tương ứng của `ContentOverlay`, `TranslatePopup`.
2. Trong `triggerOptimize` (`src/content/optimize-actions.ts`), khi không có `customText`: lấy rect của vùng chọn, nếu không có thì rect của `state.editableEl`. Lưu `anchor = { x: rect.left, y: rect.bottom + 8 }`. Khi có `customText` (tạo lại, đổi chế độ) giữ nguyên anchor cũ.
3. Thứ tự ưu tiên vị trí trong `TranslatePopup`: vị trí người dùng đã kéo (từ `useDraggable`) > `anchor` > `bottom-6 right-6`.
4. Vị trí từ anchor phải được kẹp vào viewport với lề 8px, dùng lại `clampPosition` của `useDraggable` (xuất hàm này ra hoặc cho hook nhận `initialPosition`). Nếu phía dưới không đủ chỗ thì đặt phía trên rect.

**Tiêu chí hoàn thành:**
- Chưa từng kéo popup: popup mở ngay dưới vùng chọn và nằm trọn trong viewport.
- Đã kéo: vị trí đã lưu được giữ.
- Menu chuột phải trên trang không có rect hợp lệ: quay về góc dưới phải.

**Test:** `tests/translate-popup.test.tsx`, `tests/draggable-popup.test.tsx`.

**Commit:** `feat: open the result popup next to the selection`
