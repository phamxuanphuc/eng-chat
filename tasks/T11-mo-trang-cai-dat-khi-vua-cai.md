# T11. Mở trang cài đặt khi vừa cài tiện ích

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

**Cần làm:** Trong listener `chrome.runtime.onInstalled` của `src/background/index.ts`, nhận tham số `details`. Khi `details.reason === 'install'`, gọi `chrome.runtime.openOptionsPage()` sau khi dựng menu chuột phải. Không mở khi `reason` là `update`.

**Test:** `tests/background.test.ts` (cài mới thì mở, cập nhật thì không).

**Commit:** `feat: open the options page on first install`
