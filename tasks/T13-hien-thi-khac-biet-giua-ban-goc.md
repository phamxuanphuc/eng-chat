# T13. Hiển thị khác biệt giữa bản gốc và bản Cải thiện/Viết lại

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Cần làm:**
1. Tạo `src/services/text-diff.ts`: hàm `diffWords(before: string, after: string): Array<{ type: 'same' | 'added' | 'removed'; text: string }>`. Tách token theo khoảng trắng (giữ lại khoảng trắng), dùng thuật toán LCS. Không thêm dependency. Nếu tích số token của hai chuỗi vượt 250.000, trả về `null` để bỏ qua diff.
2. Trong `PopupResult.tsx`, khi `mode` là `improve` hoặc `rewrite` và có kết quả: thêm `Button variant="ghost" size="sm"` bật/tắt "Xem thay đổi" (`aria-pressed`). Cần thêm prop `originalText`.
3. Khi bật: token `added` dùng `bg-emerald-500/15 text-emerald-200`, token `removed` dùng `line-through text-rose-400`. Khi tắt: hiển thị văn bản thường như hiện tại.
4. Nút sao chép và nút thay thế luôn dùng văn bản kết quả sạch, không dính phần bị xóa.
5. Ẩn nút khi `diffWords` trả về `null`. Nếu `PopupResult.tsx` vượt 250 dòng, tách `src/content/ui/DiffView.tsx`.
6. Key i18n mới: `content.showChanges`, `content.hideChanges`.

**Test:** test mới `tests/text-diff.test.ts` (chuỗi giống nhau, chuỗi rỗng, thêm, xóa, thay, vượt ngưỡng), `tests/popup-result.test.tsx`.

**Commit:** `feat: show word-level changes for improve and rewrite results`
