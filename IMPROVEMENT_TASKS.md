# Danh Sách Task Cải Tiến VinaWrite (sau rà soát 2026-11-10)

Tài liệu này dành cho Agent thực thi. Mỗi task độc lập, làm theo thứ tự từ trên xuống trừ khi có ghi "phụ thuộc".

## Quy tắc chung cho mọi task

- Đọc `AGENTS.md` và `DESIGN.md` trước. Hai file đó có hiệu lực cao hơn tài liệu này.
- Mỗi task = một commit theo Conventional Commits, kèm test. Không gộp nhiều task vào một commit.
- Trước khi commit, cả ba lệnh phải sạch: `pnpm test`, `pnpm lint`, `pnpm build`.
- UI chỉ dựng từ component trong `src/components/ui/`. Không dùng `<button>`, `<input>` thô, không emoji, icon lấy từ `lucide-react`.
- Mọi chuỗi hiển thị phải thêm vào cả `src/i18n/en.json` và `src/i18n/vi.json` (test `tests/i18n.test.ts` kiểm tra hai file khớp key).
- Mỗi file nguồn dưới 250 dòng. Nếu vượt, tách file trong cùng task.
- Không thêm dependency mới nếu task không ghi rõ.
- Số dòng trong tài liệu chỉ để định hướng. Hãy tìm theo tên hàm, vì số dòng có thể đã lệch.
- Môi trường test là happy-dom: `document.execCommand` có thể không tồn tại, cần mock khi test.

Trạng thái gốc khi viết tài liệu: 394 test đạt, build sạch, lint 0 lỗi và 3 cảnh báo.

---

## Ưu tiên P0: lỗi và hành vi gây phiền

### T1. Sửa "Thay thế" trên contenteditable khi không có vùng chọn

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

---

### T2. Thanh công cụ chỉ hiện khi ô nhập đã có chữ, thêm công tắc tắt hiện khi focus

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

---

### T3. Thanh công cụ bám theo khi cuộn và đổi kích thước cửa sổ

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

---

## Ưu tiên P1: trải nghiệm và nợ kỹ thuật

### T4. Popup kết quả mở gần vùng chọn thay vì góc dưới phải

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

---

### T5. Bảng tùy chọn viết lại: nút Áp dụng, đủ chiều cao, lưu mục tự thêm

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

---

### T6. Chỉ hiện thanh Lưu khi cần

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

---

### T7. Chuyển tùy chọn của overlay khỏi `localStorage` của trang web

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

---

### T8. Phân loại lỗi khóa API theo `error.key`, không theo chuỗi tiếng Anh

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

---

### T9. Dọn giao diện popup và ô nhập

Ba việc nhỏ, làm chung một commit.

1. **Placeholder ở theme sáng gần giống chữ đã nhập.** Trong `src/styles/index.css` thêm biến `--c-placeholder`: theme tối `148 163 184`, theme sáng `100 116 139`. Trong `tailwind.config.js` thêm màu `placeholder: 'rgb(var(--c-placeholder) / <alpha-value>)'`. Đổi `placeholder-slate-400` thành `placeholder-placeholder` trong `src/components/ui/Input.tsx` và `Textarea.tsx`. Đo độ tương phản placeholder trên nền ô nhập ở cả hai theme, phải từ 4.5:1 trở lên. Ghi token mới vào `DESIGN.md`.
2. **Bỏ dòng "Bản dịch VinaWrite dựa trên nội dung web và ngữ cảnh".** Xóa khối render `content.translationDisclaimer` trong `TranslatePopup.tsx` và xóa key đó ở cả hai file i18n.
3. **Hai icon bánh răng và chip dễ nhầm ở chân popup.** Trong `TranslatePopupFooter.tsx`, thay `IconButton` có icon `Cpu` bằng `Button variant="ghost" size="sm"` hiển thị tên model đang dùng (cắt ngắn bằng `max-w-[120px] truncate`), giữ `aria-label` là `common.openModelPicker`. Thêm prop `modelName?: string`, truyền từ `state.settings` (Gemini: `selectedModel`, tùy chỉnh: `customModel`) qua `ContentOverlay` và `TranslatePopup`. Sau khi đổi model trong `ModelPicker`, tên phải cập nhật (đã có listener `chrome.storage.onChanged` trong `index.tsx`).

**Test:** `tests/ui-components.test.tsx`, `tests/translate-popup.test.tsx`, `tests/popup-footer.test.tsx`.

**Commit:** `fix: clearer placeholders, model label in the popup footer, drop the translate disclaimer`

---

### T10. Dùng preset nhà cung cấp và danh sách model trong trang cài đặt

**Vấn đề:** `CUSTOM_PROVIDER_PRESETS` (`src/services/openai.ts`) và `fetchGeminiModels` (`src/services/gemini.ts`) đã viết nhưng giao diện cài đặt không dùng. Người dùng phải tự gõ Base URL và tên model.

**Cần làm trong `src/options/CustomProviderManager.tsx`:**
1. Thêm hàng `Chip` phía trên ô Base URL, mỗi chip một preset. Bấm chip gọi `onUpdateBaseUrl(preset.baseUrl)` và `onUpdateModel(preset.defaultModel)`. Chip ở trạng thái `selected` khi `baseUrl` trùng preset.
2. Thêm `Button variant="secondary" size="sm"` "Tải danh sách model" cạnh ô tên model. Khi bấm: gọi `requestHostPermission(baseUrl)`, sau đó `fetchOpenAiModels({ baseUrl, apiKey })` qua `useMutation`. Thành công thì hiện `Select` chứa danh sách, chọn mục nào gọi `onUpdateModel`. Lỗi thì hiện `Alert variant="error"` với `localizeError`.
3. Ô nhập tên model thủ công vẫn giữ.
4. Với `fetchGeminiModels`: nếu sau task này vẫn không có nơi nào trong `src/` dùng, xóa hàm và test của nó (`tests/model-list.test.ts`). Không mở rộng phạm vi sang trang Gemini.
5. Nếu file vượt 250 dòng, tách phần preset thành `src/options/ProviderPresets.tsx`.
6. Key i18n mới: `custom.presets`, `custom.loadModels`, `custom.chooseModel`.

**Tiêu chí hoàn thành:**
- Bấm chip "Groq": Base URL và model đổi đúng theo preset, thanh Lưu báo có thay đổi.
- Tải model thành công: chọn được model từ danh sách.
- Người dùng từ chối quyền host: hiện lỗi `error.hostPermission`, không gọi mạng.

**Test:** `tests/custom-provider.test.tsx`, `tests/options-permission.test.tsx`.

**Commit:** `feat: provider presets and model loading on the options page`

---

## Ưu tiên P2: tính năng mới

### T11. Mở trang cài đặt khi vừa cài tiện ích

**Cần làm:** Trong listener `chrome.runtime.onInstalled` của `src/background/index.ts`, nhận tham số `details`. Khi `details.reason === 'install'`, gọi `chrome.runtime.openOptionsPage()` sau khi dựng menu chuột phải. Không mở khi `reason` là `update`.

**Test:** `tests/background.test.ts` (cài mới thì mở, cập nhật thì không).

**Commit:** `feat: open the options page on first install`

---

### T12. Cho người dùng thấy ngữ cảnh hội thoại đã gửi

**Vấn đề:** Tính năng đọc tin nhắn gần nhất bật mặc định, nhưng popup không cho biết đã gửi bao nhiêu tin nhắn cho AI.

**Cần làm:**
1. Thêm `contextCount: number` vào `TooltipState`. Trong `triggerOptimize`, đặt bằng `contextMessages.length`. `followUp` giữ nguyên giá trị.
2. Trong `TranslatePopup`, ở hàng chứa `LanguageMenu`, khi `contextCount > 0` hiện `Badge variant="secondary" size="sm"` với nội dung `content.contextUsed` (ví dụ "Ngữ cảnh: 4 tin nhắn"), có `title` là `content.contextUsedHint` giải thích có thể tắt trong cài đặt.
3. Truyền prop qua `ContentOverlay`.

**Test:** `tests/translate-popup.test.tsx`, `tests/content-script.test.ts`.

**Commit:** `feat: show how many context messages were sent`

---

### T13. Hiển thị khác biệt giữa bản gốc và bản Cải thiện/Viết lại

**Cần làm:**
1. Tạo `src/services/text-diff.ts`: hàm `diffWords(before: string, after: string): Array<{ type: 'same' | 'added' | 'removed'; text: string }>`. Tách token theo khoảng trắng (giữ lại khoảng trắng), dùng thuật toán LCS. Không thêm dependency. Nếu tích số token của hai chuỗi vượt 250.000, trả về `null` để bỏ qua diff.
2. Trong `PopupResult.tsx`, khi `mode` là `improve` hoặc `rewrite` và có kết quả: thêm `Button variant="ghost" size="sm"` bật/tắt "Xem thay đổi" (`aria-pressed`). Cần thêm prop `originalText`.
3. Khi bật: token `added` dùng `bg-emerald-500/15 text-emerald-200`, token `removed` dùng `line-through text-rose-400`. Khi tắt: hiển thị văn bản thường như hiện tại.
4. Nút sao chép và nút thay thế luôn dùng văn bản kết quả sạch, không dính phần bị xóa.
5. Ẩn nút khi `diffWords` trả về `null`. Nếu `PopupResult.tsx` vượt 250 dòng, tách `src/content/ui/DiffView.tsx`.
6. Key i18n mới: `content.showChanges`, `content.hideChanges`.

**Test:** test mới `tests/text-diff.test.ts` (chuỗi giống nhau, chuỗi rỗng, thêm, xóa, thay, vượt ngưỡng), `tests/popup-result.test.tsx`.

**Commit:** `feat: show word-level changes for improve and rewrite results`

---

### T14. Cài đặt "ngôn ngữ mẹ đẻ" thay cho tiếng Việt gán cứng

**Vấn đề:** `ViTranslationSection` và `translateToVietnamese` (`src/content/optimize-actions.ts`) gán cứng `'Vietnamese'`, trong khi tiện ích hỗ trợ 8 ngôn ngữ đích.

**Cần làm:**
1. Thêm `nativeLanguage?: string` vào `AppSettings`, mặc định `'Vietnamese'`. Giá trị hợp lệ lấy từ `POPUP_LANGUAGES` (`src/content/ui/popup-theme.ts`).
2. Thêm `Select` "Ngôn ngữ mẹ đẻ" vào đầu `src/options/OutputLanguageSection.tsx`, đi qua `OptionsContext` (thêm vào `draft` để nút Lưu và trạng thái chưa lưu hoạt động).
3. Đổi tên `ViTranslationSection` thành `NativeTranslationSection`, nhận prop `nativeLanguage`. Các nhãn dùng tham số `{{language}}` thay cho chữ "tiếng Việt" gán cứng (sửa các key `content.translateImprovedToVietnamese`, `content.translateRewrittenToVietnamese`, `content.translateVietnamese`, `content.noVietnameseTranslation` thành key trung tính có tham số).
4. `translateToVietnamese` đổi thành `translateToNative`, dùng `state.settings?.nativeLanguage || 'Vietnamese'`.
5. Ẩn mục này khi ngôn ngữ đích của chế độ hiện tại trùng ngôn ngữ mẹ đẻ.

**Tiêu chí hoàn thành:** Người dùng cũ chưa có trường này vẫn thấy hành vi y như trước (tiếng Việt).

**Test:** `tests/translate-popup.test.tsx`, `tests/storage.test.ts`, `tests/options-components.test.tsx`, `tests/prompt.test.ts`.

**Commit:** `feat: native language setting for the back-translation section`

---

### T15. Streaming kết quả cho Cải thiện, Viết lại, Tóm tắt

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

---

## Bảo trì

### T16. Sửa 3 cảnh báo lint

`pnpm lint` báo `react-hooks/exhaustive-deps` tại `src/content/ui/ModelPicker.tsx`, `src/content/ui/useDraggable.ts`, `src/options/useKeyCooldowns.ts`. Sửa đúng nguyên nhân (thêm dependency hoặc dùng ref), không tắt rule bằng comment. Kiểm tra không sinh vòng lặp render.

**Commit:** `fix: resolve exhaustive-deps warnings`

### T17. Cập nhật tài liệu cho khớp hiện trạng

- `PRD.md`, `TASKS.md`, `TECH_SPEC.md`: đổi tên LingoFlow thành VinaWrite, trang cài đặt có 4 tab (thêm Hidden sites), số test hiện tại, bỏ tham chiếu `TooltipApp.tsx` không còn tồn tại.
- `Agents.md` mục 5: danh sách component bổ sung `Chip`, `IconButton`, `Menu`, `Select`, `SelectCard`, `Logo` cho khớp `DESIGN.md`.
- `DESIGN.md`: cập nhật mục "Last updated" và các thay đổi từ T6, T9.

Làm sau cùng, khi các task trên đã xong.

**Commit:** `docs: bring PRD, tasks and agent rules up to date`

---

## Backlog chưa đặc tả

Chưa đủ chi tiết để thực thi. Cần chủ dự án quyết định phạm vi trước:

- Dịch nhanh và công tắc bật/tắt theo trang ngay trong popup của icon tiện ích.
- Lịch sử kết quả gần đây và nút hoàn tác sau khi thay thế.
- Xuất/nhập cài đặt.
- Mở rộng nhận diện ngữ cảnh hội thoại (Messenger, Zalo, Telegram, Teams) và lấy tên người gửi.
- Nạp trễ giao diện overlay để giảm JavaScript chạy trên mỗi trang.
