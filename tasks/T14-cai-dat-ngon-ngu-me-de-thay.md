# T14. Cài đặt "ngôn ngữ mẹ đẻ" thay cho tiếng Việt gán cứng

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

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
