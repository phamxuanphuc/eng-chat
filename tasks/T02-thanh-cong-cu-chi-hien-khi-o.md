# T2. Thanh công cụ chỉ hiện khi ô nhập đã có chữ, thêm công tắc tắt hiện khi focus

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Vấn đề:** `handleFocusIn` trong `src/content/content-events.ts` gọi `callbacks.onFocus` cho mọi ô nhập, kể cả ô trống và ô tìm kiếm. Thanh công cụ che nội dung ngay dưới ô.

**Cần làm:**
1. Thêm trường `showToolbarOnFocus?: boolean` vào `AppSettings` (`src/types/index.ts`), mặc định `true` trong `DEFAULT_SETTINGS` (`src/services/storage.ts`).
2. Trong `handleFocusIn`: chỉ gọi `onFocus` khi ô có nội dung khác rỗng sau khi `trim` (`value` với input/textarea, `innerText` với contenteditable).
3. Trong `handleKeyUp`: nếu phần tử đang focus là ô nhập, không nhạy cảm, có nội dung khác rỗng, thì gọi `onFocus` với rect của nó. Mục đích: ô trống lúc focus vẫn hiện thanh công cụ sau khi người dùng gõ chữ.
4. Trong `src/content/index.tsx`, callback `onFocus` bỏ qua khi `state.settings?.showToolbarOnFocus === false`. Vẫn phải gán `state.editableEl = element`. Hiện khi bôi đen (`onSelect`) không bị ảnh hưởng.
5. Thêm `Switch` vào `src/options/pages/HiddenSitesPage.tsx`, phía trên danh sách trang. Bật/tắt lưu ngay bằng `useSettingsStore().updateSettings({ showToolbarOnFocus })`, không đi qua nút Lưu.
6. Key i18n mới: `sites.showOnFocus`, `sites.showOnFocusDescription`.

**Tiêu chí hoàn thành:**
- Focus ô trống: thanh công cụ không hiện. Gõ một ký tự: hiện.
- Tắt công tắc: focus ô có chữ không hiện, bôi đen vẫn hiện.
- Menu chuột phải và phím tắt vẫn hoạt động trong mọi trường hợp.

**Test:** `tests/content-events.test.ts`, `tests/content-script.test.ts`, `tests/hidden-sites-page.test.tsx`, `tests/storage.test.ts`.

**Commit:** `feat: show the toolbar on focus only for non-empty fields`
