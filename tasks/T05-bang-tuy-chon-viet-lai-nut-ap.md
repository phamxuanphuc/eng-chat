# T5. Bảng tùy chọn viết lại: nút Áp dụng, đủ chiều cao, lưu mục tự thêm

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:**
- `RewriteOptionsPanel` dùng `absolute inset-0` nên bị bó theo chiều cao popup. Khi kết quả ngắn, nhóm "Giọng điệu" bị khuất.
- Mỗi lần bấm chip gọi `onChange` ngay, dẫn tới `changeRewriteOptions` gọi AI. Chọn 3 tùy chọn tốn 3 lượt gọi.
- Định dạng và giọng điệu tự thêm chỉ nằm trong `useState`, đóng bảng là mất.
- `src/content/ui/style-preference.ts`: `saveSelectedStyle` được gọi nhưng `loadSelectedStyle` và sự kiện `engchat-style-preference-changed` không có nơi nào dùng.

**Cần làm:**
1. Trong `RewriteOptionsPanel`: giữ bản nháp bằng `useState<RewriteOptions>(options)`. Bấm chip chỉ cập nhật bản nháp.
2. Thêm chân bảng cố định gồm `Button variant="ghost"` "Đặt lại" (đưa bản nháp về `DEFAULT_REWRITE_OPTIONS`) và `Button variant="primary"` "Áp dụng" (gọi `onChange(draft)` rồi `onClose()`). Nút Áp dụng `disabled` khi bản nháp giống `options`.
3. Trong `TranslatePopup`: khi `showRewriteOptions` là `true`, thêm `min-h-[420px]` vào phần tử gốc của popup (vẫn giữ `max-h-[88vh]`).
4. Lưu danh sách tự thêm vào `chrome.storage.local`, key `engchat_custom_rewrite_options`, dạng `{ format: string[], tone: string[] }`. Viết module `src/content/custom-rewrite-options.ts` với `load` và `save`, bắt lỗi như `src/content/target-languages.ts`. Panel nạp danh sách khi mount.
5. Xóa `src/content/ui/style-preference.ts` và mọi import của nó. Kiểm tra test nào tham chiếu thì sửa theo.
6. Key i18n mới: `content.applyOptions`, `content.resetOptions`.

**Tiêu chí hoàn thành:**
- Bấm 3 chip rồi Áp dụng: `onChange` được gọi đúng 1 lần.
- Đóng bảng bằng X hoặc Escape: `onChange` không được gọi.
- Mục tự thêm còn nguyên sau khi đóng và mở lại bảng.
- Cả 4 nhóm tùy chọn truy cập được khi kết quả chỉ có một dòng.

**Test:** `tests/rewrite-options.test.tsx`, `tests/translate-popup.test.tsx`.

**Commit:** `feat: apply rewrite options in one request and persist custom options`
