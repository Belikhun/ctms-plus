# CTMS+
#### The Next Generation Of CTMS

![Header](/static/img/ctms-header.svg)

[![Build](https://img.shields.io/github/workflow/status/Belikhun/ctms-plus/%F0%9F%9A%80%20build%20and%20deploy?style=for-the-badge)](https://github.com/Belikhun/ctms-plus/actions/workflows/build.yml)
[![Load Test](https://img.shields.io/github/workflow/status/Belikhun/ctms-plus/%F0%9F%8D%A1%20page%20load%20test?label=%F0%9F%8D%A1%20page%20load%20test&style=for-the-badge)](https://github.com/Belikhun/ctms-plus/actions/workflows/load.yml)
[![Full Tests](https://img.shields.io/github/workflow/status/Belikhun/ctms-plus/%F0%9F%9A%80%20full%20tests%20(using%20test%20framework)?label=%F0%9F%9A%80%20full%20tests%20%28using%20test%20framework%29&style=for-the-badge)](https://github.com/Belikhun/ctms-plus/actions/workflows/tests.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/Belikhun/ctms-plus/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/Belikhun/ctms-plus)

---

### 🤔 CTMS+ là gì ?

CTMS+ là một phiên bản được *thay áo mới* của CTMS với giao diện thân thiện hơn với người dùng. Toàn bộ dữ liệu hiển thị trong CTMS+ được lấy trực tiếp từ CTMS

CTMS+ là dự án phi lợi nhuận, không hề liên quan và không được hỗ trợ bởi OTSC hoặc các bên liên quan khác

CTMS+ hiện đang chạy trên các host sau:
 * Netlify: https://ctmsplus.netlify.com
 * Vercel: https://ctmsplus.vercel.app
 * Github Pages: https://Belikhun.github.io/ctms-plus/

### 🚢 Middleware

Cross-origin resource sharing *(Chia sẻ tài nguyên nguồn gốc chéo)* là một cơ chế có sẵn trên mỗi trình duyệt dùng để kiếm soát các request khi gửi chúng tới một tên miền khác. Tuy nhiên, mọi response từ CTMS đều không có đặt header này, vì vậy trình duyệt sẽ chặn toàn bộ request đi tới CTMS dẫn tới CTMS+ không thể trực tiếp lấy dữ liệu từ CTMS. Đây chính là lí do mà **Middleware** được sử dụng. **Middleware** sẽ có nhiệm vụ lấy dữ liệu từ CTMS và trả về nó cho CTMS+ để có thể xử lí mà vẫn thỏa mãn CORS của trình duyệt.

Mã nguồn của middleware có thể tìm thấy tại [`Belikhun/ctms-plus-middleware`](https://github.com/Belikhun/ctms-plus-middleware) hoặc [`Belikhun/ctms-plus-middleware-node`](https://github.com/Belikhun/ctms-plus-middleware-node).

### 🧩 Cấu trúc repository

Repo này chứa mã nguồn của `CTMS+` và `middleware API` được sử dụng để phục vụ cho `CTMS+`, bao gồm 3 nhánh chính:

 + 🌿 Branch `main`: Chứa mã nguồn của `CTMS+`. Mọi pull request sẽ được thực hiện tới branch này. Thay đổi trong branch này sẽ tự động chạy build của Github Action và merge vào branch `production`
 + 🔮 Branch `production`: Chứa mã nguồn đã được thay đổi để phù hợp cho việc deploy site tới một host nào đó
 + 🌿 Branch khác: Chứa mã nguồn với các tính năng đang trong thời gian hoàn thiện, các commit sẽ được thực hiện tại đây trước khi được nhập vào `main`

### 🖨 Cloning

Repo này có chứa submodule, vì vậy bạn sẽ phải thực hiện clone đệ quy để tải toàn bộ code:

```bash
git clone --recursive https://github.com/Belikhun/ctms-plus.git
```

Để lấy update từ remote về máy, sử dụng:

```bash
git pull --recurse-submodules
```

### 🚀 Running

Để chạy, bạn chỉ cần khởi động một máy chủ HTTP đơn giản tại thư mục gốc của project:

```bash
#? Using Python
py -m SimpleHTTPServer 8001
# or
python3 -m SimpleHTTPServer 8001

#? Using PHP
php -S localhost:8001
```

Hoặc sử dụng [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) trong VSCode để nhanh chóng khởi động máy chủ web.

Sau khi khởi động, đi tới http://locahost:8001 để mở trang web.

### 😇 Đóng góp

Mọi đóng góp về code, ý tưởng hoặc góp ý đều được chào mừng!

Nếu bạn có một ý tưởng, một tính năng mà bạn muốn thấy trong tương lai, hoặc gặp một lỗi nào đó khi dùng phần mềm, bạn có thể gửi nó bằng cách tạo một **[Bug Report](https://github.com/Belikhun/ctms-plus/issues/new?labels=bug%2C+help+wanted&template=bug_report.md)/[Feature Request](https://github.com/Belikhun/ctms-plus/issues/new?labels=enhancement&template=feature_request.md)** trong tab *Issues* của repo này.

Nếu bạn muốn ủng hộ bằng cách viết code, hãy chắc chắn rằng bạn đã đọc qua [Contributing Guidelines](CONTRIBUTING.md) trước khi submit một pull request.