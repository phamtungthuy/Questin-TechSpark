<div align="center">
<a href="https://chatuet.id.vn/">
<img src="frontend/src/assets/questin.png" width="320" alt="questin logo">
</a>
</div>

<p align="center" >
  <a href="./README.md">English</a> |
  <a href="./README_vi.md">Vietnamese</a>
</p>

<details open>
<summary><b>📚 Mục Lục</b></summary>

- 🎮 [Bản Demo](#-bản-demo)
- 🔎 [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- 🎮 [Bắt Đầu](#-bắt-đầu)
- 🔧 [Cấu Hình](#-cấu-hình)

</details>

## 🎮 Bản Demo

Thử nghiệm bản demo tại [https://chatuet.id.vn](https://chatuet.id.vn).

## 🔎 Kiến Trúc Hệ Thống

## 🎮 Bắt Đầu

### 📝 Yêu Cầu

- CPU >= 4 nhân
- RAM >= 16 GB
- Ổ đĩa >= 50 GB
- Docker >= 24.0.0 & Docker Compose >= v2.26.1
  > Nếu bạn chưa cài đặt Docker trên máy tính của mình (Windows, Mac hoặc Linux),
  > hãy tham khảo [Cài đặt Docker Engine](https://docs.docker.com/engine/install/).

### 🚀 Khởi động máy chủ

1. Clone kho lưu trữ:

   ```bash
   $ git clone https://github.com/phamtungthuy/Questin-TechSpark.git
   ```

2. Khởi động máy chủ bằng hình ảnh Docker có sẵn:

   > Lệnh dưới đây sẽ tải phiên bản mới nhất của Questin Docker image. Nếu bạn muốn tải một phiên bản khác, hãy cập nhật biến `QUESTIN_IMAGE` trong **docker/.env** trước khi chạy `docker compose`. Ví dụ: đặt `QUESTIN_IMAGE=phamtungthuy/questin:0.1` để sử dụng phiên bản mới nhất.
   
   ```bash
   $ docker compose -f docker-compose-gpu.yml up -d
   ```

   > Lệnh dưới đây sẽ xây dựng hình ảnh Docker cục bộ.
   
   ```bash
   $ docker compose up -d
   ```

3. Kiểm tra trạng thái máy chủ sau khi khởi động:

   ```bash
   $ docker logs -f questin
   ```

   _Nếu hệ thống khởi động thành công, bạn sẽ thấy đầu ra sau:_

   ```bash

       ___  _   _ _____ ____ _____ ___ _   _
      / _ \| | | | ____/ ___|_   _|_ _| \ | |
     | | | | | | |  _| \___ \ | |  | ||  \| |
     | |_| | |_| | |___ ___) || |  | || |\  |
      \__\_\\___/|_____|____/ |_| |___|_| \_  

   ```

4. Truy cập trình duyệt web, nhập địa chỉ IP của máy chủ và đăng nhập vào Questin.
   > Với cấu hình mặc định, bạn chỉ cần nhập `http://IP_CUA_MAY_CUA_BAN` (**không cần** số cổng), vì cổng HTTP mặc định `3000` có thể bị bỏ qua trong cấu hình mặc định.

5. Trong thư mục `fastapi/service_conf.yaml`, sao chép [service_conf-sample.yaml](./fastapi/conf/service_conf-sample.yaml) thành `service_conf.yaml`. Sau đó, trong `service_conf.yaml`, chọn mô hình LLM mong muốn trong `user_default_llm` và cập nhật trường `API_KEY` với khóa API tương ứng.

   _Bây giờ hệ thống đã sẵn sàng!_

## 🔧 Cấu Hình

Để quản lý hệ thống, bạn cần thiết lập các tệp sau:

- [.env](./.env): Chứa các thiết lập cơ bản như `QUESTIN_SERVER_PORT`, `ELASTIC_PASSWORD`, `MYSQL_PASSWORD`, 
  `MINIO_PASSWORD`, v.v.
- [service_conf-sample.yaml](./fastapi/conf/service_conf-sample.yaml): Cấu hình các dịch vụ backend. Các biến môi trường trong tệp này sẽ tự động được điền khi Docker container khởi động.
- [docker-compose.yml](./docker-compose.yml): Quản lý quá trình khởi động hệ thống.

Khi cập nhật các cấu hình trên, bạn cần khởi động lại tất cả các container để thay đổi có hiệu lực:

> ```bash
> $ docker compose -f docker-compose.yml up -d
> ```

