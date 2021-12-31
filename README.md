# CTMS+
#### The Next Generation Of CTMS

[![Build](https://img.shields.io/github/workflow/status/Belikhun/ctms-plus/%F0%9F%9A%80%20build%20and%20deploy?style=for-the-badge)](https://github.com/Belikhun/ctms-plus/actions/workflows/build.yml)
[![Test](https://img.shields.io/github/workflow/status/Belikhun/ctms-plus/%F0%9F%A5%97%20browser%20test?label=TEST&style=for-the-badge)](https://github.com/Belikhun/ctms-plus/actions/workflows/test.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/Belikhun/ctms-plus/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/Belikhun/ctms-plus)

---

### 🤔 CTMS+ là gì ?

CTMS+ là một phiên bản được *thay áo mới* của CTMS với giao diện thân thiện hơn với người dùng. Toàn bộ dữ liệu hiển thị trong CTMS+ được lấy trực tiếp từ CTMS

CTMS+ là dự án phi lợi nhuận, không hề liên quan và không được hỗ trợ bởi OTSC hoặc các bên liên quan khác

CTMS+ hiện đang chạy trên các host sau:
 * Netlify: https://ctmsplus.netlify.com
 * Vercel: https://ctmsplus.vercel.app
 * Github Pages: https://Belikhun.github.io/ctms-plus/

### ☠ CTMS+ có đáng tin cậy không ?

CTMS+ gửi trực tiếp request của bạn tới CTMS thông qua middleware. Middleware hoạt động như một **shipper** có nhiệm vụ gửi yêu cầu của bạn tới đích một cách hiệu quả. Middleware được sử dụng để vượt qua những giới hạn của trình duyệt, nhờ đó mà CTMS+ có thể truy xuất dữ liệu trực tiếp từ CTMS. Tuy nhiên Middleware không có tính năng thu thập thông tin hay dữ liệu của bạn khi được gửi, bạn có thể kiểm tra điều này bằng cách đọc mã nguồn của middleware.

Mã nguồn của middleware có thể tìm thấy tại [`Belikhun/ctms-plus-middleware/api/middleware.php`](https://github.com/Belikhun/ctms-plus-middleware).

### 🧩 Cấu trúc repository

Repo này chứa mã nguồn của `CTMS+` và `middleware API` được sử dụng để phục vụ cho `CTMS+`, bao gồm 3 nhánh chính:

 + 🌿 Branch `main`: Chứa mã nguồn của `CTMS+`. Mọi pull request sẽ được thực hiện tới branch này. Thay đổi trong branch này sẽ tự động chạy build của Github Action và merge vào branch `production`
 + 🌿 Branch `bug-*`, `feature-*`: Chứa mã nguồn với các tính năng đang trong thời gian hoàn thiện, các commit sẽ được thực hiện tại đây trước khi được nhập vào `main`
 + 🔮 Branch `production`: Chứa mã nguồn đã được thay đổi để phù hợp cho việc deploy site tới một host nào đó

### 😇 Đóng góp

> **⚠ Dự án hiện đang trong giai đoạn hoàn thiện và còn rất nhiều lỗi cũng như một số tính năng căn bản!**

Chúng mình không nhận tiền mặt làm hình thức đóng góp, thay vào đó chúng mình sẽ tiếp nhận công sức đóng góp của mọi người! Mọi đóng góp về code, ý tưởng hoặc góp ý đều được chào mừng!

Nếu bạn có một ý tưởng, một tính năng mà bạn muốn thấy trong tương lai, hoặc gặp một lỗi nào đó khi dùng phần mềm, bạn có thể gửi nó bằng cách tạo một **[Bug Report](https://github.com/Belikhun/ctms-plus/issues/new?labels=bug%2C+help+wanted&template=bug_report.md)/[Feature Request](https://github.com/Belikhun/ctms-plus/issues/new?labels=enhancement&template=feature_request.md)** trong tab *Issues* của repo này.

Nếu bạn muốn ủng hộ bằng cách viết code, hãy chắc chắn rằng bạn đã đọc qua [Contributing Guidelines](CONTRIBUTING.md) trước khi submit một pull request