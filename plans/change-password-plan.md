# Kế hoạch phát triển tính năng "Change Password" (Đổi mật khẩu)

## 1. Giới thiệu
Mục tiêu của kế hoạch này là thiết kế và triển khai tính năng cho phép người dùng thay đổi mật khẩu (Change Password) từ bên trong ứng dụng (thông qua Settings). Người dùng sẽ cần nhập mật khẩu cũ để xác thực, sau đó nhập mật khẩu mới và xác nhận mật khẩu mới để đổi mật khẩu.

## 2. Chi tiết các thay đổi dự kiến

### 2.1. Cập nhật màn hình Quyền riêng tư & Bảo mật
- **File:** `src/components/layout/PrivacySecurityPanel.tsx`
- **Thay đổi:** 
  - Thêm một mục (menu item) "Đổi mật khẩu" (Change Password) vào danh sách.
  - Tích hợp biểu tượng chìa khoá hoặc khiên bảo vệ.
  - Khi người dùng click, trigger sự kiện `onNavigate("change-password")` để chuyển sang màn hình đổi mật khẩu.

### 2.2. Tạo Component màn hình Đổi Mật Khẩu
- **File:** `src/components/layout/ChangePasswordPanel.tsx` (Tạo mới)
- **Chức năng & Giao diện:**
  - Tiêu đề: "Đổi mật khẩu", kèm nút Back để quay lại màn hình trước.
  - Form nhập liệu gồm 3 trường (sử dụng icon hiển thị/ẩn mật khẩu):
    1. **Mật khẩu hiện tại** (Current password)
    2. **Mật khẩu mới** (New password)
    3. **Xác nhận mật khẩu mới** (Confirm new password)
  - **Validation:** 
    - Các trường không được để trống.
    - Mật khẩu mới và Xác nhận mật khẩu mới phải khớp nhau.
    - (Tuỳ chọn) Kiểm tra độ mạnh của mật khẩu mới (chiều dài tối thiểu, ký tự đặc biệt...).
  - **Gọi API:** Sử dụng hàm `authService.updatePassword(payload)` với payload dự kiến là `{ oldPassword, newPassword }`.
  - Hiển thị Toast thông báo thành công, và tự động clear form hoặc chuyển hướng người dùng.

### 2.3. Cập nhật luồng điều hướng trong Main Layout
- **File:** `src/components/layout/MainLayout.tsx` (hoặc file quản lý Panel tương ứng)
- **Thay đổi:**
  - Lắng nghe state `change-password` để render component `ChangePasswordPanel` đã tạo ở bước 2.2.

## 3. Thiết kế UI/UX chi tiết (Detailed UI/UX Design)
Để đảm bảo trải nghiệm người dùng (UX) mượt mà và giao diện (UI) mang lại cảm giác cao cấp, hiện đại (Premium & Dynamic), tính năng Đổi mật khẩu sẽ áp dụng các tiêu chuẩn thiết kế sau:

### 3.1. Ngôn ngữ thiết kế (Design Language)
- **Màu sắc chủ đạo (Color Palette):** Sử dụng các gam màu trung tính sang trọng cho nền (trắng/xám nhạt ở Light mode, xanh đen/đen slate ở Dark mode) kết hợp với màu primary (Xanh Blue/Gradients) để tạo điểm nhấn cho các nút bấm và trạng thái Focus.
- **Typography:** Kế thừa font chữ hiện đại của hệ thống (Inter/Roboto) với phân cấp rõ ràng (Tiêu đề in đậm, mô tả chữ nhỏ và nhạt màu hơn).

### 3.2. Cấu trúc Component (`ChangePasswordPanel`)
- **Header:** 
  - Nút Back (`<FiArrowLeft>`) bên trái, có hiệu ứng hover mượt mà (background chuyển xám nhẹ).
  - Tiêu đề "Đổi mật khẩu" ở giữa.
  - Sticky header với hiệu ứng shadow nhẹ hoặc mờ (glassmorphism/blur) khi scroll xuống.
- **Form Area:**
  - **Input Fields:** 
    - Có viền bo góc (rounded-lg hoặc rounded-xl).
    - Biểu tượng khoá (`<FiLock>`) ở đầu (prefix icon).
    - Nút hiển thị/ẩn mật khẩu (Eye/Eye-off icon) ở cuối, giúp người dùng dễ dàng kiểm tra lại những gì đã nhập.
    - Hiệu ứng Focus: Đường viền phát sáng (Glow ring) mượt mà với màu primary, kèm theo nhãn dán (label) nổi lên (Floating label) hoặc tooltip hướng dẫn.
  - **Password Strength Meter (Thanh đo độ mạnh mật khẩu):**
    - Xuất hiện ngay dưới ô "Mật khẩu mới".
    - Là một thanh tiến trình (Progress bar) 3 đến 4 mức độ: Đỏ (Yếu) -> Vàng (Trung bình) -> Xanh lá (Mạnh).
    - Hiển thị các tiêu chí cần đạt: (Ví dụ: "Ít nhất 8 ký tự", "Có chữ in hoa", "Có số/ký tự đặc biệt"). Khi đạt tiêu chí nào, tiêu chí đó chuyển màu xanh với dấu check.
  - **Cảnh báo lỗi (Error State):** 
    - Nếu nhập sai hoặc không khớp, viền ô nhập chuyển đỏ (Red ring) kèm hiệu ứng rung nhẹ (Shake animation). Thông báo lỗi nhỏ màu đỏ xuất hiện mượt mà ngay dưới ô nhập.
- **Nút Xác nhận (Submit Button):**
  - Trạng thái mặc định: Disable (mờ đi) nếu form chưa điền đúng và đủ.
  - Trạng thái Active: Màu primary gradient, hiệu ứng hover nổi bật.
  - Trạng thái Loading: Hiển thị icon xoay (Spinner) và vô hiệu hoá nút tránh spam click trong lúc chờ API.

### 3.3. Tương tác vi mô (Micro-animations)
- Panel trượt (Slide-in) từ phải sang giống các Panel Settings khác, giữ sự thống nhất UX.
- Khi nhập liệu, các icon transition nhịp nhàng.
- Toast Notification: Bật lên (pop-up) mượt mà ở góc màn hình hoặc giữa màn hình với icon Check (Thành công) hoặc Alert (Lỗi) và biến mất sau 3 giây.

## 4. Câu hỏi mở (Open Questions) cần xác nhận
> [!IMPORTANT]
> Vui lòng phản hồi các câu hỏi sau để chốt phương án thực hiện:
1. Payload chính xác của API `/auth/change-password` là gì? (Có phải là `{ oldPassword, newPassword }` không?)
2. Sau khi người dùng đổi mật khẩu thành công trong app, chúng ta có yêu cầu hệ thống tự động đăng xuất các thiết bị khác (Revoke other sessions) hay buộc người dùng đăng nhập lại ngay lập tức không?

## 5. Kế hoạch kiểm thử (Verification)
- **Test Case 1:** Mở Settings -> Quyền riêng tư & Bảo mật -> Nhấn "Đổi mật khẩu" -> Hiển thị đúng giao diện form.
- **Test Case 2:** UI/UX Test - Focus vào ô nhập phải có viền sáng, bấm nút "mắt" phải chuyển đổi hiển thị/ẩn mật khẩu.
- **Test Case 3:** Test Password Strength - Nhập mật khẩu yếu, trung bình, mạnh để xem thanh đo và màu sắc có cập nhật đúng không.
- **Test Case 4:** Nhập mật khẩu mới và xác nhận mật khẩu không khớp -> Báo lỗi validation (chữ đỏ/viền đỏ) và Disable nút Lưu.
- **Test Case 5:** Submit thành công -> Hiển thị nút Loading -> Toast thông báo thành công.
