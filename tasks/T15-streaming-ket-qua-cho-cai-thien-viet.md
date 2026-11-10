# T15. Streaming kết quả cho Cải thiện, Viết lại, Tóm tắt

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

Task lớn nhất. Phụ thuộc T8. Trước khi viết mã, đọc tài liệu chính thức của Gemini API (`streamGenerateContent`) và OpenAI Chat Completions (`stream: true`) để xác nhận định dạng SSE, vì chi tiết dưới đây cần được kiểm chứng.

**Phạm vi:** chỉ ba chế độ trả văn bản thuần. Chế độ Dịch (trả JSON) và yêu cầu `translateOnly` giữ nguyên đường không streaming.

**Cần làm:**
1. Tạo `src/services/stream.ts`: hàm đọc SSE bằng `fetch` và `ReadableStream`, gọi `onChunk(text)` cho từng phần. Gemini: `POST {model}:streamGenerateContent?alt=sse`, header `x-goog-api-key`, bỏ qua part có `thought: true`. OpenAI-compatible: `stream: true`, đọc `choices[0].delta.content`, dừng ở `[DONE]`. Lỗi HTTP ánh xạ sang cùng các `ApiError` như `callGeminiApi` và `callOpenAiApi`.
2. Background (`src/background/index.ts`): thêm `chrome.runtime.onConnect` cho port tên `engchat_stream`. Nhận `{ payload: OptimizeRequest }`, gửi lại `{ type: 'chunk', text }`, cuối cùng `{ type: 'done', data }` hoặc `{ type: 'error', error }`. Xoay khóa Gemini chỉ áp dụng trước khi có chunk đầu tiên. Port bị ngắt thì hủy `fetch` bằng `AbortController`.
3. Content (`src/content/optimize-actions.ts`): với ba chế độ trên, dùng port thay cho `sendRuntimeMessage`. Mỗi chunk nối vào `state.tooltip.result` rồi `render()`. Vẫn tôn trọng `requestId` để bỏ kết quả cũ. Đóng popup thì ngắt port.
4. Thêm `isStreaming: boolean` vào `TooltipState`. Trong lúc streaming: hiện văn bản đang về thay cho `Loader`, nút Thay thế và Sao chép `disabled`.
5. Phím tắt thay thế trực tiếp (không mở popup) giữ đường không streaming.
6. Nếu server không hỗ trợ streaming (lỗi trước chunk đầu), tự lùi về đường cũ một lần.

**Tiêu chí hoàn thành:**
- Văn bản xuất hiện dần trong popup.
- Đóng popup giữa chừng hủy được request.
- Lỗi 401/429 hiển thị cùng thông báo như hiện nay, xoay khóa vẫn hoạt động.

**Test:** test mới `tests/stream.test.ts` (phân tích SSE cho cả hai nhà cung cấp, chunk bị cắt giữa dòng, lỗi HTTP), bổ sung `tests/background.test.ts`, `tests/content-script.test.ts`, `tests/translate-popup.test.tsx`.

**Commit:** tách thành 3 commit: `feat: SSE streaming client for Gemini and OpenAI-compatible providers`, `feat: stream results through a runtime port`, `feat: render streamed results in the popup`.
