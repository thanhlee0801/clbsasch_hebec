# HEBEC Books – Flutter Mobile

Bản này chuyển prototype `nha_sach_hebec_home.html` sang Flutter/Dart theo hướng mobile-first.

## Đã chuyển
- Header + bottom navigation trên điện thoại
- Tìm kiếm sách
- Carousel banner đọc từ `assets/banners/manifest.json`
- 14 danh mục, lọc danh mục và bỏ lọc khi bấm lại
- Lưới sản phẩm 2 cột
- Sắp xếp giá/tên
- Phân trang
- Chi tiết sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Giỏ hàng dạng bottom sheet
- 5 bài viết + trang chi tiết bài viết
- Trang giới thiệu

## Cài asset
Copy các thư mục asset của website hiện tại vào:
- `assets/brand/`
- `assets/products/`
- `assets/banners/`
- `assets/fonts/`

Đặc biệt cần giữ:
- `assets/brand/logo.png`
- `assets/products/01.webp` ... `16.webp`
- `assets/banners/manifest.json`
- các file PNG banner được liệt kê trong manifest
- nếu dùng font Inter: `assets/fonts/InterVariable.ttf`

## Chạy
```bash
flutter pub get
flutter run
```

Build Android:
```bash
flutter build apk --release
```
