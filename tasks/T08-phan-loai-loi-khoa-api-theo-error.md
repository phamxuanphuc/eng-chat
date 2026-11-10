# T8. Phân loại lỗi khóa API theo `error.key`, không theo chuỗi tiếng Anh

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** Trong vòng lặp của `executeOptimize` (`src/services/gemini.ts`), mã dùng `msg.includes('404')` và `classifyKeyFailure(msg)` (regex trên câu tiếng Anh lấy từ `src/i18n/en.json`). Sửa câu chữ trong `en.json` sẽ làm hỏng ngầm việc xoay khóa và việc lùi về model mặc định.

**Cần làm:**
1. Trong `src/services/key-cooldown.ts`, thêm `classifyKeyError(error: unknown): KeyFailure | null`:
   - `ApiError` có `key === 'error.geminiInvalidKey'` trả về `'invalid'`.
   - `ApiError` có `key === 'error.geminiQuota'` trả về `'quota'`.
   - Lỗi không phải `ApiError`: gọi `classifyKeyFailure(message)` như cũ.
2. Trong `executeOptimize`: thay `classifyKeyFailure(msg)` bằng `classifyKeyError(err)`, và thay `msg.includes('404')` bằng `err instanceof ApiError && err.key === 'error.geminiModelNotFound'`.

**Tiêu chí hoàn thành:** Test mới tạo `ApiError` rồi kiểm tra phân loại mà không so chuỗi thông báo. Toàn bộ test xoay khóa hiện có vẫn đạt.

**Test:** `tests/key-cooldown.test.ts`, `tests/gemini.test.ts`, `tests/e2e-multi-key.test.tsx`.

**Commit:** `refactor: classify key failures by error key instead of message text`
