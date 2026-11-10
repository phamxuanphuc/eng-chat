# T3. Thanh công cụ bám theo khi cuộn và đổi kích thước cửa sổ

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** Thanh công cụ dùng `position: fixed` với toạ độ tính một lần. Không có listener `scroll` nào trong `src/content/`, nên khi cuộn nó đứng yên còn đoạn văn trôi đi.

**Cần làm:**
1. Thêm callback `onViewportChange: () => void` vào `ContentEventCallbacks`. Trong `setupDOMEvents`, đăng ký `scroll` trên `document` (capture, passive) và `resize` trên `window`, gom bằng `requestAnimationFrame` (tối đa một lần gọi mỗi frame). Gỡ listener trong hàm cleanup.
2. Trong `src/content/content-state.ts`, thêm `toolbarAnchor: (() => DOMRect | null) | null`. Khi `showToolbarAt` được gọi từ `onFocus`, anchor trả về `element.getBoundingClientRect()`. Khi gọi từ `onSelect`, anchor trả về rect của vùng chọn hiện tại, hoặc `null` nếu vùng chọn đã mất. Cần đổi chữ ký `onSelect`/`onFocus` hoặc tính anchor ngay trong `index.tsx`.
3. Trong `onViewportChange` (`src/content/index.tsx`): nếu thanh công cụ đang hiện, lấy rect từ anchor. Rect `null`, kích thước 0 hoặc nằm hoàn toàn ngoài viewport thì ẩn thanh công cụ. Ngược lại `patchToolbar(computeToolbarPos(rect))` rồi `render()`.

**Tiêu chí hoàn thành:**
- Cuộn trang khi thanh công cụ đang hiện: toạ độ cập nhật theo rect mới.
- Cuộn tới khi vùng neo ra khỏi viewport: thanh công cụ ẩn.
- Cleanup gỡ hết listener, không còn `requestAnimationFrame` treo.

**Test:** `tests/content-events.test.ts`, `tests/content-script.test.ts`.

**Commit:** `fix: keep the floating toolbar attached to its anchor while scrolling`
