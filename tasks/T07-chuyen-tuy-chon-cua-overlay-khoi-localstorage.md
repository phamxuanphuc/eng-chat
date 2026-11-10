# T7. Chuyển tùy chọn của overlay khỏi `localStorage` của trang web

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** Content script dùng `localStorage` của chính trang web đang mở:
- `src/content/ui/useDraggable.ts`: key `engchat_popup_position`.
- `src/store/usePresetSectionStore.ts`: key `engchat-preset-section` (trạng thái ghim).

Hậu quả: ghi dữ liệu lạ vào storage của site, và mỗi site nhớ một vị trí popup khác nhau.

**Cần làm:**
1. Tạo `src/content/overlay-prefs.ts`: giữ cache trong bộ nhớ `{ popupPosition: Position | null, pinnedBySection: Record<PopupMode, boolean> }`, có `loadOverlayPrefs()` (đọc `chrome.storage.local` key `engchat_overlay_prefs`), `getOverlayPrefs()` (đồng bộ, đọc cache), `saveOverlayPrefs(partial)`. Khi không có `chrome.storage` (trang standalone) thì dùng `localStorage` làm dự phòng.
2. `src/content/index.tsx`: gọi `loadOverlayPrefs()` lúc khởi động cùng các lần nạp khác, rồi `render()` khi xong. Lắng nghe `chrome.storage.onChanged` cho key này để các tab đồng bộ.
3. `useDraggable`: nhận `initialPosition` và `onPersist(position)` thay cho `storageKey`. `TranslatePopup` truyền hai giá trị này từ `overlay-prefs`.
4. Thay `usePresetSectionStore` bằng `overlay-prefs` trong `content-state.ts` (`isPinned`) và `index.tsx` (`onTogglePin`). Xóa `src/store/usePresetSectionStore.ts` nếu không còn nơi nào dùng.

**Tiêu chí hoàn thành:**
- Sau khi kéo popup và bật ghim, `window.localStorage` của trang không có key nào bắt đầu bằng `engchat`.
- Vị trí và trạng thái ghim được đọc lại từ `chrome.storage.local`.

**Test:** `tests/draggable-popup.test.tsx`, `tests/content-script.test.ts`, test mới `tests/overlay-prefs.test.ts`.

**Commit:** `refactor: store overlay preferences in chrome.storage instead of page localStorage`
