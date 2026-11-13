# VinaWrite

VinaWrite là tiện ích mở rộng Chrome Manifest V3 hỗ trợ **cải thiện, viết lại, tóm tắt và dịch văn bản ngay trên mọi trang web**. Ứng dụng dùng API key của người dùng và kết nối trực tiếp tới Google Gemini hoặc các nhà cung cấp tương thích OpenAI.

## Tính năng

- **Improve**: sửa ngữ pháp và làm câu tự nhiên hơn.
- **Rewrite**: viết lại theo văn phong, độ dài và định dạng mong muốn.
- **Summary**: tóm tắt văn bản được chọn.
- **Translate**: dịch văn bản và hỗ trợ giải thích từ vựng/ngữ pháp.
- Thanh công cụ nổi khi bôi đen hoặc focus ô nhập liệu.
- Popup kết quả hỗ trợ streaming, đổi model, đổi ngôn ngữ, hỏi tiếp, sao chép và thay thế trực tiếp vào ô nhập.
- Kích hoạt qua menu chuột phải hoặc phím tắt `Ctrl+Shift+E` (`Cmd+Shift+E` trên macOS).
- Hỗ trợ Google Gemini và mọi API tương thích OpenAI như OpenAI, OpenRouter, Groq, Ollama hoặc LM Studio.
- Nhiều API key Gemini với cơ chế luân phiên khi gặp lỗi quota hoặc xác thực.
- Ngữ cảnh hội thoại cho các nền tảng như Slack, Discord, Microsoft Teams, WhatsApp, Telegram, Messenger, Zalo, LinkedIn và X.
- Giao diện song ngữ English / Vietnamese, theme System / Light / Dark.
- Thiết lập trang ẩn thanh công cụ và ngôn ngữ đầu ra riêng cho từng chế độ.

## Yêu cầu

- Node.js 18 trở lên.
- pnpm 9 trở lên.
- Google Chrome hoặc trình duyệt Chromium hỗ trợ Manifest V3.

## Cài đặt

```bash
pnpm install
```

Nếu pnpm yêu cầu xác nhận build script của dependency, chạy:

```bash
pnpm approve-builds
```

## Phát triển

Khởi chạy Vite ở chế độ development:

```bash
pnpm dev
```

Chạy bản standalone để xem giao diện thử nghiệm:

```bash
pnpm dev:standalone
```

## Kiểm tra chất lượng

Chạy unit và integration tests:

```bash
pnpm test
```

Chạy lint:

```bash
pnpm lint
```

Kiểm tra TypeScript và build production:

```bash
pnpm build
```

Tạo gói ZIP để phân phối:

```bash
pnpm package
```

Lệnh trên tạo `vinawrite.zip` ở thư mục gốc và thư mục build tại `dist/`.

## Cài tiện ích local trên Chrome

1. Chạy `pnpm build`.
2. Mở `chrome://extensions`.
3. Bật **Developer mode**.
4. Chọn **Load unpacked**.
5. Chọn thư mục `dist/`.
6. Mở trang Options của VinaWrite để cấu hình nhà cung cấp AI và API key.

Sau khi thay đổi mã nguồn, chạy lại `pnpm build`, rồi bấm **Reload** trên trang `chrome://extensions`.

## Cấu hình AI

VinaWrite không có server trung gian. API key được lưu trong vùng lưu trữ của extension và request được gửi trực tiếp tới nhà cung cấp AI đã chọn.

### Google Gemini

- Nhập một hoặc nhiều API key.
- Chọn model Gemini được hỗ trợ.
- Có thể kiểm tra kết nối từ trang cài đặt.
- Extension tự luân phiên key khi gặp lỗi `401`, `403` hoặc `429`.

### OpenAI-compatible

- Chọn preset có sẵn hoặc nhập Base URL tùy chỉnh.
- Nhập API key.
- Tải danh sách model từ provider.
- Chọn model mặc định để xử lý văn bản.

## Cấu trúc chính

```text
src/
├── background/       Service worker, context menu và stream port
├── components/ui/    Bộ component giao diện dùng chung
├── content/          Content script, floating toolbar và overlay trên trang web
├── i18n/             Bản dịch English / Vietnamese
├── options/           Trang cài đặt extension
├── popup/             Popup mở từ icon extension
├── services/          API client, storage, streaming và xử lý lỗi
├── standalone/        Giao diện standalone để phát triển và kiểm thử
└── store/             Zustand settings store
```

## Kiến trúc và quyền riêng tư

- Xây dựng bằng React, TypeScript, Vite và `@crxjs/vite-plugin`.
- Sử dụng Chrome Manifest V3 với service worker và content script.
- Cài đặt được lưu chủ yếu trong `chrome.storage.local`, có hỗ trợ đồng bộ và fallback phù hợp.
- Không gửi dữ liệu qua backend của VinaWrite.
- Host permission được dùng để chèn content script vào trang web và gọi Base URL tùy chỉnh của provider.
- Ngữ cảnh hội thoại chỉ được thu thập khi người dùng bật tính năng tương ứng.

## Tài liệu dự án

- [PRD.md](./PRD.md): yêu cầu và phạm vi sản phẩm.
- [DESIGN.md](./DESIGN.md): nguyên tắc giao diện, màu sắc, typography và accessibility.
- [TECH_SPEC.md](./TECH_SPEC.md): đặc tả kỹ thuật.
- [TASKS.md](./TASKS.md): danh sách và tiến độ công việc.
- [Agents.md](./Agents.md): quy tắc đóng góp và kiểm thử trong repository.

## Đóng góp

Trước khi tạo pull request, hãy chạy đầy đủ:

```bash
pnpm test
pnpm lint
pnpm build
```

Mỗi thay đổi logic nên đi kèm test phù hợp. Commit sử dụng Conventional Commits, ví dụ `feat: add provider preset` hoặc `fix: handle empty selection`.

## License

Chưa khai báo license công khai cho repository này.
