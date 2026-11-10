# T1. Sửa "Thay thế" trên contenteditable khi không có vùng chọn

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** Trong `replaceTextInElement` (`src/content/dom-utils.ts`), nhánh contenteditable gán `element.textContent = newText` khi vùng chọn rỗng. Việc này xóa định dạng, mất Ctrl+Z và làm lệch trạng thái của trình soạn thảo như Slack, Gmail, Notion. `applyEdit` (`src/content/edit-target.ts`) đi vào nhánh này mỗi khi snapshot không có `range`.

**Cần làm:**
1. Trong nhánh contenteditable của `replaceTextInElement`, thay thế theo thứ tự ưu tiên:
   1. Nếu vùng chọn rỗng hoặc nằm ngoài `element`: tạo `Range`, gọi `range.selectNodeContents(element)`, đặt làm vùng chọn hiện tại.
   2. Gọi `document.execCommand('insertText', false, newText)`. Nếu trả về `true` thì xong.
   3. Nếu trả về `false` hoặc không có `execCommand`: dispatch `ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData })` với `DataTransfer` chứa `text/plain`. Nếu sự kiện bị `preventDefault` (trình soạn thảo đã tự xử lý) thì coi là thành công.
   4. Chỉ khi cả hai cách trên thất bại mới gán `textContent`, sau đó dispatch `input`.
2. Giữ nguyên hành vi hiện tại cho `<input>` và `<textarea>`.

**Tiêu chí hoàn thành:**
- Contenteditable không có vùng chọn: `execCommand('insertText')` được gọi sau khi toàn bộ nội dung đã được chọn, và `textContent` không bị gán trực tiếp.
- Contenteditable có vùng chọn: chỉ phần được chọn bị thay.
- Khi `execCommand` trả về `false`: có sự kiện `paste` mang đúng văn bản.

**Test:** bổ sung vào `tests/dom-utils.test.ts`, `tests/edit-target.test.ts`, `tests/popup-replace.test.tsx`.

**Commit:** `fix: replace contenteditable text through insertText instead of textContent`
