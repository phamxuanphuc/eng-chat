# T9. Dọn giao diện popup và ô nhập

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

Ba việc nhỏ, làm chung một commit.

1. **Placeholder ở theme sáng gần giống chữ đã nhập.** Trong `src/styles/index.css` thêm biến `--c-placeholder`: theme tối `148 163 184`, theme sáng `100 116 139`. Trong `tailwind.config.js` thêm màu `placeholder: 'rgb(var(--c-placeholder) / <alpha-value>)'`. Đổi `placeholder-slate-400` thành `placeholder-placeholder` trong `src/components/ui/Input.tsx` và `Textarea.tsx`. Đo độ tương phản placeholder trên nền ô nhập ở cả hai theme, phải từ 4.5:1 trở lên. Ghi token mới vào `DESIGN.md`.
2. **Bỏ dòng "Bản dịch VinaWrite dựa trên nội dung web và ngữ cảnh".** Xóa khối render `content.translationDisclaimer` trong `TranslatePopup.tsx` và xóa key đó ở cả hai file i18n.
3. **Hai icon bánh răng và chip dễ nhầm ở chân popup.** Trong `TranslatePopupFooter.tsx`, thay `IconButton` có icon `Cpu` bằng `Button variant="ghost" size="sm"` hiển thị tên model đang dùng (cắt ngắn bằng `max-w-[120px] truncate`), giữ `aria-label` là `common.openModelPicker`. Thêm prop `modelName?: string`, truyền từ `state.settings` (Gemini: `selectedModel`, tùy chỉnh: `customModel`) qua `ContentOverlay` và `TranslatePopup`. Sau khi đổi model trong `ModelPicker`, tên phải cập nhật (đã có listener `chrome.storage.onChanged` trong `index.tsx`).

**Test:** `tests/ui-components.test.tsx`, `tests/translate-popup.test.tsx`, `tests/popup-footer.test.tsx`.

**Commit:** `fix: clearer placeholders, model label in the popup footer, drop the translate disclaimer`
