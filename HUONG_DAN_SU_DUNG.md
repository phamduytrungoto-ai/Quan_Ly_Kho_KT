# 📘 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ KHO SMV

---

## 📋 MỤC LỤC

1. [Đăng nhập hệ thống](#1-đăng-nhập-hệ-thống)
2. [Giao diện chính](#2-giao-diện-chính)
3. [Tổng quan (Dashboard)](#3-tổng-quan-dashboard)
4. [Tồn kho](#4-tồn-kho)
5. [Lịch sử nhập xuất kho](#5-lịch-sử-nhập-xuất-kho)
6. [Phiếu nhập kho](#6-phiếu-nhập-kho)
7. [Phiếu xuất kho](#7-phiếu-xuất-kho)
8. [Danh mục](#8-danh-mục)
9. [Chuyển kho](#9-chuyển-kho)
10. [Báo cáo](#10-báo-cáo)
11. [Đổi mật khẩu & Đăng xuất](#11-đổi-mật-khẩu--đăng-xuất)
12. [Mẹo sử dụng nhanh](#12-mẹo-sử-dụng-nhanh)

---

## 1. ĐĂNG NHẬP HỆ THỐNG

### 1.1. Truy cập hệ thống
- Mở trình duyệt web (Chrome, Edge, Firefox...).
- Nhập địa chỉ: **http://localhost:8888** (nếu dùng cùng máy chạy server) hoặc **http://[IP_máy_chủ]:8888** (nếu truy cập từ máy khác trong cùng mạng LAN).

### 1.2. Đăng nhập
- Tại màn hình đăng nhập, nhập **Tên đăng nhập** và **Mật khẩu** được cấp.
- Nhấn nút **Đăng nhập** hoặc nhấn phím **Enter**.
- Nếu quên mật khẩu, nhấn vào liên kết **"Quên mật khẩu?"** và liên hệ quản trị viên để được hỗ trợ.

> **Lưu ý:** Tài khoản của bạn có thể bị giới hạn quyền (chỉ xem, không được thêm/sửa/xóa) tùy theo phân quyền do quản trị viên thiết lập.

---

## 2. GIAO DIỆN CHÍNH

Sau khi đăng nhập thành công, bạn sẽ thấy giao diện chính gồm 3 phần:

### 2.1. Thanh bên trái (Sidebar)
Đây là menu điều hướng chính, gồm các mục:

| Biểu tượng | Tên menu | Chức năng |
|---|---|---|
| 📊 | **Tổng quan** | Xem thống kê tổng hợp, biểu đồ, cảnh báo |
| 📦 | **Tồn kho** | Xem danh sách vật tư và số lượng tồn kho |
| 🕐 | **Lịch sử nhập xuất kho** | Tra cứu lịch sử tất cả giao dịch nhập/xuất |
| 📥 | **Phiếu nhập kho** | Tạo và quản lý phiếu nhập kho |
| 📤 | **Phiếu xuất kho** | Tạo và quản lý phiếu xuất kho |
| 🏷️ | **Danh mục** | Quản lý danh mục (công đoạn, nhân viên, ĐVT...) |
| 🔄 | **Chuyển kho** | Chuyển vật tư giữa các kho |
| 📑 | **Báo cáo** | Xem và xuất báo cáo |

### 2.2. Thanh trên cùng (Topbar)
- **Chọn kho:** Dropdown cho phép chuyển đổi giữa các kho (VD: Kho Kỹ thuật Sản xuất, Kho Kỹ thuật Thiết bị...). Tất cả dữ liệu trên trang sẽ thay đổi theo kho được chọn.
- **Chế độ Sáng/Tối:** Nhấn biểu tượng ☀️/🌙 để chuyển đổi giao diện sáng hoặc tối.
- **Đồng hồ:** Hiển thị ngày giờ hiện tại.

### 2.3. Vùng nội dung chính
Hiển thị nội dung chi tiết của từng trang (tồn kho, phiếu nhập, phiếu xuất...).

---

## 3. TỔNG QUAN (Dashboard)

Đây là trang mặc định sau khi đăng nhập, cung cấp cái nhìn tổng quát:

### 3.1. Thẻ KPI (4 ô thống kê nhanh)
- **Tổng mặt hàng:** Số lượng loại vật tư đang quản lý trong kho.
- **Nhập trong ngày:** Tổng số lượng vật tư đã nhập kho hôm nay.
- **Xuất trong ngày:** Tổng số lượng vật tư đã xuất kho hôm nay.
- **Cảnh báo tồn kho:** Số mặt hàng có tồn kho dưới định mức (màu đỏ). Nhấn vào ô này để xem danh sách chi tiết các mặt hàng cần bổ sung.

### 3.2. Biểu đồ xu hướng
- Hiển thị biểu đồ đường thể hiện xu hướng **Nhập/Xuất** trong 6 tháng gần nhất.
- Giúp bạn nắm bắt được tình hình biến động nhập xuất kho theo thời gian.

### 3.3. Giao dịch mới nhất
- Danh sách các giao dịch nhập/xuất gần nhất.
- Mỗi dòng hiển thị: Tên hàng, Loại (Nhập/Xuất), Ngày, Người thực hiện, Số lượng.

---

## 4. TỒN KHO

Trang này hiển thị toàn bộ danh sách vật tư trong kho đang chọn.

### 4.1. Thanh công cụ lọc & tìm kiếm
Nằm ngay trên đầu bảng, gồm các chức năng:

- **Ô tìm kiếm:** Gõ tên hoặc mã số vật tư để tìm nhanh. Hệ thống sẽ gợi ý tự động (autocomplete) khi bạn gõ từ 2 ký tự trở lên.
- **Lọc theo ngày (Từ - Đến):** Lọc vật tư theo khoảng thời gian tạo.
- **Lọc trạng thái tồn:** Chọn "Dưới định mức" để chỉ xem những mặt hàng cần bổ sung.
- **Lọc loại vật tư:** Lọc theo Tiêu hao / Dự phòng / Công cụ dụng cụ.
- **Lọc kiểm kê:** Lọc theo trạng thái Có/Không kiểm kê.
- **Nút làm mới (🔄):** Xóa tất cả bộ lọc, tải lại dữ liệu mới nhất.
- **Nút Xuất Excel:** Xuất toàn bộ danh sách tồn kho ra file Excel (.xlsx).

### 4.2. Bảng danh sách vật tư
Các cột thông tin:

| Cột | Mô tả |
|---|---|
| STT | Số thứ tự |
| Hình ảnh | Ảnh minh họa vật tư (nếu có) |
| Tên hàng | Tên đầy đủ của vật tư |
| Mã số | Mã sản phẩm / Part number |
| Loại vật tư | Tiêu hao / Dự phòng / Công cụ |
| Vị trí | Vị trí lưu trữ trong kho |
| ĐVT | Đơn vị tính (Pcs, Roll, Set...) |
| Tồn đầu | Số lượng đầu kỳ |
| Nhập | Tổng số đã nhập |
| Xuất | Tổng số đã xuất |
| Tồn cuối | Số lượng tồn kho hiện tại (**số đỏ** = dưới định mức) |
| Định mức | Mức tối thiểu cần duy trì |
| Trạng thái | Có/Không kiểm kê |
| Công đoạn | Công đoạn sử dụng |

### 4.3. Sắp xếp dữ liệu
- Nhấn vào **tiêu đề cột** (VD: Tên hàng, Tồn cuối...) để sắp xếp tăng/giảm dần.
- Nhấn lần 1: sắp xếp tăng dần (A→Z, 0→9).
- Nhấn lần 2: sắp xếp giảm dần (Z→A, 9→0).

### 4.4. Phân trang
- Thanh phân trang hiển thị ở **cả đầu và cuối bảng**.
- Hiển thị thông tin: "Hiển thị **1** - **50** trong tổng số **80**".
- Nhấn số trang hoặc mũi tên ◀ ▶ để chuyển trang.

### 4.5. Xem chi tiết sản phẩm
Nhấn vào **bất kỳ dòng nào** trong bảng để mở cửa sổ **Chi Tiết Sản Phẩm**, gồm:

- **Khu vực hình ảnh (bên trái):**
  - Hiển thị ảnh sản phẩm (nếu có).
  - Nhấn vào ảnh để phóng to (Lightbox), dùng mũi tên ◀ ▶ hoặc phím bàn phím để xem ảnh trước/sau.
  - Nút **"Tải ảnh lên"** cho phép thêm ảnh mới cho sản phẩm.

- **Thông tin sản phẩm (bên phải):**
  - Tên hàng, Mã số, Mã quản lý.
  - Nhà cung cấp, Vị trí, Loại vật tư.
  - Tồn kho hiện tại, Công đoạn, Đơn giá.

- **Thông số kỹ thuật & Chi tiết:**
  - Ô nhập liệu lớn để ghi thông số kỹ thuật chi tiết của vật tư.
  - Sau khi chỉnh sửa, nhấn nút **"Lưu Thông Số"** để lưu.

- **Các nút thao tác:**
  - **Xóa:** Xóa vật tư khỏi hệ thống (cần có quyền xóa).
  - **Sửa:** Mở form chỉnh sửa thông tin vật tư (tên, mã số, ĐVT, vị trí, loại vật tư...).
  - **Đóng:** Đóng cửa sổ chi tiết.
  - **Lưu Thông Số:** Lưu thông số kỹ thuật đã nhập.

---

## 5. LỊCH SỬ NHẬP XUẤT KHO

Trang này tổng hợp toàn bộ lịch sử nhập và xuất kho.

### 5.1. Tab lọc theo loại
- **Tất cả:** Hiển thị toàn bộ giao dịch nhập + xuất.
- **Lịch sử nhập:** Chỉ hiển thị giao dịch nhập kho.
- **Lịch sử xuất:** Chỉ hiển thị giao dịch xuất kho.

### 5.2. Thanh công cụ
- **Tìm kiếm:** Gõ tên hoặc mã hàng để lọc nhanh.
- **Từ Ngày / Đến Ngày:** Lọc giao dịch trong khoảng thời gian cụ thể.
- **Nút lọc (🔍):** Áp dụng bộ lọc ngày.
- **Xuất Excel:** Xuất danh sách lịch sử ra file Excel.

### 5.3. Bảng lịch sử
Mỗi dòng giao dịch hiển thị:

| Cột | Mô tả |
|---|---|
| STT | Số thứ tự |
| Loại | **NHẬP** (badge xanh) hoặc **XUẤT** (badge cam) |
| Ngày | Ngày thực hiện giao dịch |
| Tên hàng | Tên vật tư |
| Mã số | Mã sản phẩm |
| Số lượng | Số lượng nhập/xuất (xanh = nhập, cam = xuất) |
| ĐVT | Đơn vị tính |
| Công đoạn | Công đoạn liên quan |
| Người thực hiện | Người nhập hoặc người xuất |
| Người yêu cầu/nhận | Dùng cho phiếu xuất |
| Trạng thái | Có/Không kiểm kê |
| Ghi chú | Ghi chú bổ sung |

### 5.4. Nút tạo phiếu nhanh
- **Tạo phiếu nhập (nút xanh):** Chuyển sang trang Phiếu nhập kho.
- **Tạo phiếu xuất (nút cam):** Chuyển sang trang Phiếu xuất kho.

---

## 6. PHIẾU NHẬP KHO

### 6.1. Mở form tạo phiếu
- Nhấn nút **"+ Tạo phiếu nhập"** (góc trên bên phải).
- Form tạo phiếu sẽ hiện ra phía trên danh sách phiếu.

### 6.2. Điền thông tin phiếu
**Bước 1: Thông tin chung**
- **Ngày nhập:** Mặc định là ngày hôm nay, có thể thay đổi.
- **Người nhập:** Tự động lấy tên người đang đăng nhập (không thể chỉnh sửa).
- **Ghi chú chung:** Nhập nội dung, lý do nhập kho (tùy chọn).

**Bước 2: Thêm mặt hàng vào phiếu**
1. Tại ô **"Tên hàng hóa"**, gõ tên hoặc mã vật tư cần nhập.
2. Danh sách gợi ý sẽ hiện ra → Nhấn chọn mặt hàng phù hợp.
3. Hệ thống tự động điền: Mã số, Tồn hiện tại, Đơn vị tính.
4. Nhập **Số lượng nhập** vào ô tương ứng.
5. Nhập **Ghi chú mặt hàng** (nếu có).
6. Nhấn nút **"+ Thêm vào phiếu"**.
7. Mặt hàng sẽ xuất hiện trong bảng tạm bên dưới.
8. Lặp lại bước 1-7 để thêm nhiều mặt hàng vào cùng 1 phiếu.

> **Lưu ý:** Nếu vật tư chưa có trong hệ thống, bạn có thể nhấn nút **"Tạo mới vật tư"** để thêm vật tư mới rồi thêm vào phiếu.

**Bước 3: Xác nhận phiếu nhập**
- Kiểm tra lại danh sách mặt hàng trong bảng tạm.
- Nếu cần xóa mặt hàng nào, nhấn nút **xóa (🗑️)** trên dòng đó.
- Nhấn nút **"Xác nhận nhập kho"** để hoàn tất.
- Hệ thống sẽ tự động cập nhật tồn kho.

### 6.3. Danh sách phiếu nhập đã tạo
- Phía dưới form là bảng liệt kê tất cả phiếu nhập đã tạo.
- Nhấn vào phiếu để xem chi tiết (danh sách mặt hàng, số lượng, ngày nhập...).

---

## 7. PHIẾU XUẤT KHO

### 7.1. Mở form tạo phiếu
- Nhấn nút **"+ Tạo phiếu xuất"** (góc trên bên phải).

### 7.2. Điền thông tin phiếu
**Bước 1: Thông tin chung**
- **Ngày xuất:** Mặc định là ngày hôm nay.
- **Người yêu cầu:** Nhập tên bộ phận hoặc người yêu cầu xuất kho (hệ thống sẽ gợi ý từ danh mục nhân viên).
- **Người lập phiếu / Người xuất:** Tự động lấy tên người đang đăng nhập.
- **Người nhận:** Nhập tên người nhận hàng.
- **Ghi chú chung:** Lý do xuất kho (tùy chọn).

**Bước 2: Thêm mặt hàng vào phiếu**
1. Gõ tên hoặc mã vật tư tại ô **"Tên hàng hóa"**.
2. Chọn mặt hàng từ danh sách gợi ý.
3. Hệ thống hiển thị: Mã số, Tồn hiện tại, Đơn vị tính.
4. Nhập **Số lượng xuất** (không được vượt quá tồn hiện tại).
5. Chọn **Công đoạn** (nếu có).
6. Chọn **Loại xuất** (nếu có).
7. Nhập **Ghi chú** (nếu có).
8. Nhấn **"+ Thêm vào phiếu"**.
9. Lặp lại để thêm nhiều mặt hàng.

**Bước 3: Xác nhận phiếu xuất**
- Kiểm tra lại danh sách mặt hàng.
- Nhấn **"Xác nhận xuất kho"** để hoàn tất.
- Hệ thống sẽ tự động trừ số lượng tồn kho tương ứng.

> **Lưu ý quan trọng:** Số lượng xuất **không được lớn hơn** tồn kho hiện tại. Nếu vượt quá, hệ thống sẽ từ chối và hiện thông báo lỗi.

### 7.3. Danh sách phiếu xuất đã tạo
- Tương tự phiếu nhập, phía dưới là bảng liệt kê tất cả phiếu xuất.
- Nhấn vào phiếu để xem chi tiết.

---

## 8. DANH MỤC

Trang quản lý các danh mục dùng chung trong hệ thống, chia thành 5 cột:

| Cột | Mô tả | Ví dụ |
|---|---|---|
| **Công đoạn** | Các công đoạn sản xuất | Kensa, E/D CHECK, CELL... |
| **Nhân viên** | Danh sách nhân viên | Phấn 2307, Sự 1402... |
| **Đơn vị tính** | Các loại đơn vị tính | Pcs, Roll, Set, Kg... |
| **Vị trí** | Vị trí lưu trữ trong kho | Kệ A1, Kệ B2... |
| **Mã quản lý** | Mã nội bộ quản lý | MQL001, MQL002... |

### 8.1. Thêm mục mới
- Nhấn nút **"+"** ở góc trên bên phải mỗi cột.
- Nhập tên mục mới → Nhấn **Lưu**.

### 8.2. Tìm kiếm
- Mỗi cột có ô tìm kiếm riêng. Gõ để lọc nhanh trong danh sách.

### 8.3. Sửa / Xóa
- Di chuột vào mục bất kỳ để hiện các nút **Sửa** (✏️) và **Xóa** (🗑️).
- Nhấn **Sửa** để chỉnh sửa tên → Nhấn **Lưu**.
- Nhấn **Xóa** → Xác nhận để xóa khỏi danh mục.

> **Mẹo:** Các danh mục này sẽ tự động xuất hiện dưới dạng gợi ý (autocomplete) khi bạn tạo phiếu nhập/xuất, giúp tiết kiệm thời gian nhập liệu.

---

## 9. CHUYỂN KHO

Dùng để chuyển vật tư từ kho này sang kho khác.

### 9.1. Tạo phiếu chuyển kho
1. Nhấn nút **"+ Tạo phiếu chuyển"**.
2. Chọn **Kho nguồn** (kho xuất đi).
3. Chọn **Kho đích** (kho nhận vào).
4. Nhập **Ngày chuyển**, **Người chuyển**, **Ghi chú**.
5. Thêm các mặt hàng cần chuyển (tương tự phiếu xuất).
6. Nhấn **Xác nhận** để hoàn tất.

### 9.2. Kết quả chuyển kho
- Hệ thống tự động **trừ** tồn kho ở kho nguồn.
- Hệ thống tự động **cộng** tồn kho ở kho đích.
- Phiếu chuyển được lưu lại để tra cứu.

### 9.3. Danh sách phiếu chuyển
- Bảng hiển thị: Mã phiếu, Ngày chuyển, Từ kho, Đến kho, Người chuyển, Ghi chú.
- Nhấn vào phiếu để xem chi tiết danh sách vật tư đã chuyển.

---

## 10. BÁO CÁO

Trang báo cáo cho phép bạn xem và xuất các báo cáo tổng hợp dưới dạng file Excel.

---

## 11. ĐỔI MẬT KHẨU & ĐĂNG XUẤT

### 11.1. Đổi mật khẩu
1. Nhấn vào biểu tượng **"⋯"** (3 chấm) ở góc dưới cùng bên trái (thanh bên).
2. Chọn **"Đổi mật khẩu"**.
3. Nhập **Mật khẩu cũ**.
4. Nhập **Mật khẩu mới** (nên dùng ít nhất 6 ký tự).
5. Nhập lại **Xác nhận mật khẩu mới**.
6. Nhấn **Lưu** để hoàn tất.

### 11.2. Đăng xuất
1. Nhấn vào biểu tượng **"⋯"** (3 chấm) ở góc dưới cùng bên trái.
2. Chọn **"Đăng xuất"** (chữ đỏ).
3. Hệ thống sẽ quay về màn hình đăng nhập.

---

## 12. MẸO SỬ DỤNG NHANH

### ⌨️ Thao tác nhanh
- **F5:** Tải lại trang để cập nhật dữ liệu mới nhất.
- **Ctrl + F:** Tìm kiếm nhanh trên trang (chức năng trình duyệt).
- **Enter:** Xác nhận form sau khi điền đầy đủ thông tin.

### 🔍 Tìm kiếm thông minh
- Bạn chỉ cần gõ **2 ký tự trở lên**, hệ thống sẽ tự động gợi ý mặt hàng phù hợp.
- Có thể tìm theo **tên hàng** hoặc **mã số**.

### 📊 Chuyển kho nhanh
- Dùng dropdown **chọn kho** trên thanh trên cùng để xem dữ liệu của từng kho riêng biệt mà không cần chuyển trang.

### 🌙 Chế độ tối
- Nhấn biểu tượng ☀️/🌙 trên thanh trên cùng để chuyển đổi giao diện sáng/tối. Chế độ tối giúp giảm mỏi mắt khi làm việc lâu.

### ⚠️ Những điều cần lưu ý
1. **Không tự ý xóa** vật tư hoặc giao dịch nếu không được phép.
2. **Luôn kiểm tra kỹ** số lượng trước khi xác nhận phiếu nhập/xuất.
3. Nếu nhập/xuất sai, hãy **liên hệ quản trị viên** để hoàn tác.
4. Thường xuyên kiểm tra **Cảnh báo tồn kho** trên Dashboard để bổ sung vật tư kịp thời.

---

> **Liên hệ hỗ trợ kỹ thuật:**
> - **Người phụ trách:** Phạm Duy Trung
> - **Email:** trung.phamduy@vn.sharp-world.com

---

*© 2026 SMV System - Hệ thống Quản lý Kho Thông Minh*
