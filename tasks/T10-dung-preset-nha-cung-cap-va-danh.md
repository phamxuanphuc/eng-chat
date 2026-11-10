# T10. Dùng preset nhà cung cấp và danh sách model trong trang cài đặt

- [x] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

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
