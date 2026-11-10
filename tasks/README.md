# Task Cải Tiến VinaWrite (sau rà soát 2026-11-10)

Thư mục này dành cho Agent thực thi. Mỗi task nằm trong một file riêng, độc lập, làm theo thứ tự từ trên xuống trừ khi file ghi "phụ thuộc".

## Quy tắc đánh dấu hoàn thành (bắt buộc)

Một task chỉ được coi là xong khi cả hai checkbox của nó đã được đánh dấu:

1. Dòng `- [ ] Hoàn thành` ở đầu file task đổi thành `- [x] Hoàn thành`.
2. Dòng tương ứng trong mục "Tiến độ" bên dưới đổi từ `- [ ]` thành `- [x]`.

Điều kiện để đánh dấu:

- Mọi mục trong "Tiêu chí hoàn thành" của task đã đạt và đã có test.
- `pnpm test`, `pnpm lint`, `pnpm build` đều sạch.
- Việc đánh dấu nằm trong cùng commit với mã của task (task nhiều commit thì đánh dấu ở commit cuối).

Không đánh dấu khi task mới làm một phần. Nếu bị chặn, giữ `- [ ]` và thêm một dòng `**Bị chặn:** <lý do>` ngay dưới checkbox trong file task.

Trước khi bắt đầu, đọc mục "Tiến độ" và chọn task đầu tiên còn `- [ ]`.

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

## Tiến độ

### Ưu tiên P0: lỗi và hành vi gây phiền

- [x] [T1. Sửa "Thay thế" trên contenteditable khi không có vùng chọn](T01-sua-thay-the-tren-contenteditable-khi-khong.md)
- [x] [T2. Thanh công cụ chỉ hiện khi ô nhập đã có chữ, thêm công tắc tắt hiện khi focus](T02-thanh-cong-cu-chi-hien-khi-o.md)
- [x] [T3. Thanh công cụ bám theo khi cuộn và đổi kích thước cửa sổ](T03-thanh-cong-cu-bam-theo-khi-cuon.md)

### Ưu tiên P1: trải nghiệm và nợ kỹ thuật

- [x] [T4. Popup kết quả mở gần vùng chọn thay vì góc dưới phải](T04-popup-ket-qua-mo-gan-vung-chon.md)
- [x] [T5. Bảng tùy chọn viết lại: nút Áp dụng, đủ chiều cao, lưu mục tự thêm](T05-bang-tuy-chon-viet-lai-nut-ap.md)
- [x] [T6. Chỉ hiện thanh Lưu khi cần](T06-chi-hien-thanh-luu-khi-can.md)
- [x] [T7. Chuyển tùy chọn của overlay khỏi `localStorage` của trang web](T07-chuyen-tuy-chon-cua-overlay-khoi-localstorage.md)
- [x] [T8. Phân loại lỗi khóa API theo `error.key`, không theo chuỗi tiếng Anh](T08-phan-loai-loi-khoa-api-theo-error.md)
- [x] [T9. Dọn giao diện popup và ô nhập](T09-don-giao-dien-popup-va-o-nhap.md)
- [x] [T10. Dùng preset nhà cung cấp và danh sách model trong trang cài đặt](T10-dung-preset-nha-cung-cap-va-danh.md)

### Ưu tiên P2: tính năng mới

- [x] [T11. Mở trang cài đặt khi vừa cài tiện ích](T11-mo-trang-cai-dat-khi-vua-cai.md)
- [x] [T12. Cho người dùng thấy ngữ cảnh hội thoại đã gửi](T12-cho-nguoi-dung-thay-ngu-canh-hoi.md)
- [x] [T13. Hiển thị khác biệt giữa bản gốc và bản Cải thiện/Viết lại](T13-hien-thi-khac-biet-giua-ban-goc.md)
- [x] [T14. Cài đặt "ngôn ngữ mẹ đẻ" thay cho tiếng Việt gán cứng](T14-cai-dat-ngon-ngu-me-de-thay.md)
- [x] [T15. Streaming kết quả cho Cải thiện, Viết lại, Tóm tắt](T15-streaming-ket-qua-cho-cai-thien-viet.md)

### Bảo trì

- [x] [T16. Sửa 3 cảnh báo lint](T16-sua-3-canh-bao-lint.md)
- [x] [T17. Cập nhật tài liệu cho khớp hiện trạng](T17-cap-nhat-tai-lieu-cho-khop-hien.md)

## Backlog chưa đặc tả


Chưa đủ chi tiết để thực thi. Cần chủ dự án quyết định phạm vi trước:

- Dịch nhanh và công tắc bật/tắt theo trang ngay trong popup của icon tiện ích.
- Lịch sử kết quả gần đây và nút hoàn tác sau khi thay thế.
- Xuất/nhập cài đặt.
- Mở rộng nhận diện ngữ cảnh hội thoại (Messenger, Zalo, Telegram, Teams) và lấy tên người gửi.
- Nạp trễ giao diện overlay để giảm JavaScript chạy trên mỗi trang.
