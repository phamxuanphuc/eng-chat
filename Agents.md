# Quy Tắc Hoạt Động Của Agent (Agents.md)

Tài liệu này định nghĩa các tiêu chuẩn bắt buộc mà Agent và lập trình viên phải tuân thủ trong suốt quá trình phát triển dự án.

---

## 1. Quản Lý Git Commit
- **Tần suất**: Tạo Git commit ngay sau mỗi lần thực hiện thay đổi logic hoặc hoàn thành một đơn vị công việc.
- **Tính nguyên tử (Atomic Commits)**: Mỗi commit chỉ tập trung vào một nhiệm vụ cụ thể, đi kèm mã nguồn và bài test tương ứng.
- **Quy chuẩn thông điệp (Conventional Commits)**:
  - `feat`: Thêm tính năng mới.
  - `fix`: Sửa lỗi.
  - `test`: Thêm hoặc cập nhật bài test.
  - `refactor`: Tối ưu hoặc tái cấu trúc mã nguồn.
  - `docs`: Cập nhật tài liệu.
  - `chore`: Cấu hình, bảo trì hoặc tác vụ phụ trợ.

## 2. Quy Trình Kiểm Thử & Xác Thực (Testing & QA)
- **Bắt buộc viết test kèm theo**: Mọi thay đổi logic đều phải đi kèm bài test tương ứng (Unit Test / Integration Test).
- **Kiểm thử trường hợp biên**: Đảm bảo bao quát các trường hợp ngoại lệ (edge cases), dữ liệu rỗng và xử lý lỗi (error handling).
- **Điều kiện bàn giao**:
  - Toàn bộ bài test phải chạy thành công (100% pass).
  - Không có cảnh báo lỗi nghiêm trọng, lỗi cú pháp hoặc lỗi kiểu dữ liệu (lint/type-check).
  - Nghiêm cấm bàn giao khi chưa kiểm thử hoặc khi có bài test thất bại.

## 3. Trải Nghiệm Người Dùng Cuối (End-to-End Verification)
- **Đóng vai người dùng cuối**: Sau khi hoàn thành một tính năng, thực hiện kiểm tra luồng trải nghiệm thực tế (user flow) từ đầu đến cuối.
- **Tiêu chí đánh giá**:
  - *Tính đúng đắn*: Tính năng giải quyết chính xác nhu cầu đặt ra.
  - *Trải nghiệm*: Tương tác thuận tiện, thông điệp phản hồi rõ ràng, dễ hiểu.
  - *Độ tin cậy*: Ứng dụng không bị crash, treo hoặc phản hồi sai khi gặp dữ liệu bất thường.
- **Tối ưu liên tục (Iterative Refinement)**: Nếu trải nghiệm chưa thực sự mượt mà hoặc chưa đạt tiêu chuẩn, tiếp tục tinh chỉnh và tối ưu cho đến khi đạt mức độ hài lòng cao nhất trước khi hoàn tất.

## 4. Chuẩn Mực Mã Nguồn (Code Standards)
- Giữ các file mã nguồn ngắn gọn, tối ưu (khuyến nghị dưới 250 dòng/file).
- Tách biệt hoàn toàn mock data khỏi logic nghiệp vụ của mã nguồn.
- Giữ cấu trúc dự án sạch sẽ, loại bỏ triệt để mã nguồn thừa và không thêm chú thích (comments) mặc định trong source code.

## 5. Quy Chuẩn Giao Diện Bắt Buộc (UI Component Standards)
- **Bắt buộc sử dụng UI Components chuẩn**: Mọi màn hình giao diện (Popup, Options, Shadow DOM Tooltip/Modal) BẮT BUỘC chỉ được xây dựng từ các component chuẩn hóa theo [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) nằm trong thư mục `src/components/ui/` (`Button`, `Input`, `Textarea`, `Switch`, `Loader`, `ToneCard`, `Badge`, `Alert`).
- **Nghiêm cấm tự tạo UI tự phát**: Tuyệt đối KHÔNG tự viết style CSS thô, không tự sáng tạo kiểu dáng mới hoặc dùng các thẻ HTML thuần (`<button>`, `<input>`,...) mà không thông qua UI component chuẩn.
- **Tính nhất quán thị giác**: Toàn bộ hiệu ứng (glow border, gradient, hover scaling, galaxy loader) phải đồng bộ tuyệt đối theo phong cách Uiverse Galaxy đã định nghĩa.
