# T16. Sửa 3 cảnh báo lint

- [ ] Hoàn thành

> Đọc [README.md](README.md) trước: quy tắc chung và cách đánh dấu hoàn thành.

`pnpm lint` báo `react-hooks/exhaustive-deps` tại `src/content/ui/ModelPicker.tsx`, `src/content/ui/useDraggable.ts`, `src/options/useKeyCooldowns.ts`. Sửa đúng nguyên nhân (thêm dependency hoặc dùng ref), không tắt rule bằng comment. Kiểm tra không sinh vòng lặp render.

**Commit:** `fix: resolve exhaustive-deps warnings`
