-- ============================================================================
-- HỆ THỐNG HỆ SINH THÁI SÁCH HỌC ĐƯỜNG & THƯƠNG MẠI ĐIỆN TỬ
-- Tích hợp: Sáng tác + AI Coach + Tạp chí + Cuộc thi + Bán hàng & Kho vận
-- ============================================================================

CREATE DATABASE IF NOT EXISTS school_book_ecosystem_full
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE school_book_ecosystem_full;

-- ============================================================================
-- 1. NHÓM TỔ CHỨC, NGƯỜI DÙNG & PHÂN QUYỀN (Identity, RBAC & Organization)
-- ============================================================================

-- Bảng Organization (Cấu trúc cây: Công ty, Trường, CLB, Lớp)
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('COMPANY', 'SCHOOL', 'CLUB', 'CLASS', 'GROUP') NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id INT DEFAULT NULL,
    org_code VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_parent FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng roles (Danh sách vai trò Admin/Nhân viên)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng permissions (Danh sách quyền chi tiết)
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE, -- VD: 'order:view', 'book:approve'
    module VARCHAR(50) NOT NULL,
    description TEXT DEFAULT NULL
) ENGINE=InnoDB;

-- Bảng role_permissions (Trung gian Phân quyền RBAC)
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng users (Tài khoản Học sinh, Giáo viên, Phụ huynh, Khách mua)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'SUPER_ADMIN', 'COMPANY_ADMIN', 'SCHOOL_ADMIN', 
        'CLUB_LEADER', 'TEACHER', 'STUDENT', 
        'PARENT', 'EDITOR', 'JUDGE', 'AUTHOR', 'CUSTOMER'
    ) NOT NULL DEFAULT 'STUDENT',
    status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') DEFAULT 'ACTIVE',
    parent_id INT DEFAULT NULL, -- Liên kết Phụ huynh - Học sinh
    consent_status BOOLEAN DEFAULT FALSE, -- Đồng ý điều khoản trẻ em
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email),
    INDEX idx_user_phone (phone)
) ENGINE=InnoDB;

-- Bảng admin_users (Nhiên viên / Quản trị vận hành hệ thống)
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_secret VARCHAR(255) DEFAULT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Bảng user_addresses (Sổ địa chỉ nhận hàng)
CREATE TABLE user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province_id INT NOT NULL,
    district_id INT NOT NULL,
    ward_id INT NOT NULL,
    detail_address VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng memberships (Thành viên thuộc Trường/CLB)
CREATE TABLE memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    role_in_org VARCHAR(100) DEFAULT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_mem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_org (user_id, organization_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. NHÓM ĐỌC & SÁNG TẠO NỘI DUNG (Reading & Content)
-- ============================================================================

-- Bảng works (Tác phẩm cá nhân: Bài viết, Thơ, Tranh ảnh, Video...)
CREATE TABLE works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('ARTICLE', 'STORY', 'POEM', 'PAINTING', 'PHOTO', 'VIDEO') NOT NULL,
    organization_id INT NOT NULL,
    body LONGTEXT DEFAULT NULL,
    media_urls JSON DEFAULT NULL,
    age_group VARCHAR(50) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    moderation_status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
    visibility ENUM('PRIVATE', 'SCHOOL', 'COMMUNITY', 'PUBLIC') DEFAULT 'PRIVATE',
    copyright_status VARCHAR(100) DEFAULT 'OWNED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_work_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_work_status (moderation_status),
    INDEX idx_work_visibility (visibility)
) ENGINE=InnoDB;

-- Bảng work_authors (Đồng tác giả bài viết)
CREATE TABLE work_authors (
    work_id INT NOT NULL,
    user_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (work_id, user_id),
    CONSTRAINT fk_wa_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    CONSTRAINT fk_wa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng reading_logs (Nhật ký đọc sách)
CREATE TABLE reading_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    reading_time_minutes INT DEFAULT 0,
    notes_thoughts TEXT DEFAULT NULL,
    read_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 3. NHÓM XƯỞNG SÁCH AI & TẠP CHÍ HỌC ĐƯỜNG
-- ============================================================================

-- Bảng book_projects (Dự án viết sách)
CREATE TABLE book_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_audience VARCHAR(100) DEFAULT NULL,
    genre VARCHAR(100) DEFAULT NULL,
    objective TEXT DEFAULT NULL,
    message TEXT DEFAULT NULL,
    ideas TEXT DEFAULT NULL,
    workflow_status ENUM(
        'IDEA', 'OUTLINE', 'DRAFTING', 'TEACHER_REVIEW', 
        'EDITORIAL', 'DESIGN', 'PREFLIGHT', 'PUBLISHING_REVIEW', 
        'PUBLISHED', 'DISTRIBUTION'
    ) DEFAULT 'IDEA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bp_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng book_chapters (Các chương trong sách)
CREATE TABLE book_chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    chapter_order INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    objective TEXT DEFAULT NULL,
    content LONGTEXT DEFAULT NULL,
    status ENUM('DRAFT', 'IN_REVIEW', 'COMPLETED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bc_book FOREIGN KEY (book_id) REFERENCES book_projects(id) ON DELETE CASCADE,
    INDEX idx_bc_order (book_id, chapter_order)
) ENGINE=InnoDB;

-- Bảng references_tab (Tài liệu tham khảo/RAG AI Input)
CREATE TABLE references_tab (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT DEFAULT NULL,
    owner_id INT NOT NULL,
    source_type ENUM('FILE', 'URL', 'NOTE') NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_or_web_url VARCHAR(500) DEFAULT NULL,
    citation TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ref_book FOREIGN KEY (book_id) REFERENCES book_projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_ref_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng ai_interactions (Nhật ký tương tác với AI)
CREATE TABLE ai_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module VARCHAR(50) NOT NULL, -- AI_COACH, AI_EDITOR, AI_RESEARCH, AI_COVER
    input_context LONGTEXT DEFAULT NULL,
    output LONGTEXT DEFAULT NULL,
    model_used VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng magazines (Tạp chí trường)
CREATE TABLE magazines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    issue_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    theme VARCHAR(255) DEFAULT NULL,
    status ENUM('EDITORIAL', 'LAYOUT', 'PUBLISHED') DEFAULT 'EDITORIAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mag_school FOREIGN KEY (school_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng articles (Bài viết chọn vào tạp chí)
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    magazine_id INT NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    work_id INT DEFAULT NULL,
    content LONGTEXT NOT NULL,
    review_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_art_mag FOREIGN KEY (magazine_id) REFERENCES magazines(id) ON DELETE CASCADE,
    CONSTRAINT fk_art_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 4. NHÓM CUỘC THI & CHẤM ĐIỂM (Competition)
-- ============================================================================

-- Bảng competitions (Cuộc thi sáng tác)
CREATE TABLE competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    rubric_config JSON NOT NULL, -- Cấu hình trọng số Rubric
    status ENUM('DRAFT', 'OPEN', 'JUDGING', 'COMPLETED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comp_org FOREIGN KEY (organizer_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng submissions (Bài đệ trình dự thi)
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    work_id INT NOT NULL,
    eligibility_status ENUM('PENDING', 'ELIGIBLE', 'INELIGIBLE') DEFAULT 'PENDING',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
    UNIQUE KEY uk_comp_work (competition_id, work_id)
) ENGINE=InnoDB;

-- Bảng judges (Giám khảo)
CREATE TABLE judges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    user_id INT NOT NULL,
    conflict_status BOOLEAN DEFAULT FALSE, -- Cảnh báo xung đột lợi ích
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_judge_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_judge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_comp_judge (competition_id, user_id)
) ENGINE=InnoDB;

-- Bảng scores (Điểm số chi tiết)
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    judge_id INT NOT NULL,
    rubric_item VARCHAR(100) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_score_sub FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_score_judge FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
    UNIQUE KEY uk_sub_judge_rubric (submission_id, judge_id, rubric_item)
) ENGINE=InnoDB;

-- Bảng awards (Giải thưởng)
CREATE TABLE awards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    submission_id INT NOT NULL,
    prize VARCHAR(100) NOT NULL,
    certificate_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_award_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_award_sub FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 5. NHÓM DANH MỤC SẢN PHẨM & KHO HÀNG (Catalog & Inventory)
-- ============================================================================

-- Bảng categories (Danh mục sản phẩm đệ quy đa cấp)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng authors (Tác giả bán lẻ)
CREATE TABLE authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    bio TEXT DEFAULT NULL
) ENGINE=InnoDB;

-- Bảng publishers (Nhà xuất bản)
CREATE TABLE publishers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB;

-- Bảng brands (Thương hiệu Văn phòng phẩm)
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

-- Bảng products (Sản phẩm gốc)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    author_id INT DEFAULT NULL,
    publisher_id INT DEFAULT NULL,
    brand_id INT DEFAULT NULL,
    book_id INT DEFAULT NULL, -- Liên kết đến Dự án sách học sinh (nếu xuất bản)
    magazine_id INT DEFAULT NULL, -- Liên kết Tạp chí (nếu xuất bản)
    product_type ENUM('BOOK', 'STATIONERY') NOT NULL DEFAULT 'BOOK',
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description LONGTEXT DEFAULT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'INACTIVE') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
    CONSTRAINT fk_prod_pub FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL,
    CONSTRAINT fk_prod_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    CONSTRAINT fk_prod_book FOREIGN KEY (book_id) REFERENCES book_projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_prod_mag FOREIGN KEY (magazine_id) REFERENCES magazines(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng product_variants (Biến thể SKU & Kiểm soát tồn kho)
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) DEFAULT NULL,
    isbn VARCHAR(100) DEFAULT NULL,
    original_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0, -- Tồn thực tế
    reserved_quantity INT NOT NULL DEFAULT 0, -- Tồn đang giữ chỗ cho đơn chờ thanh toán
    format ENUM('PRINT', 'EBOOK', 'PDF') NOT NULL DEFAULT 'PRINT',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng product_attributes (Thuộc tính sản phẩm Key-Value)
CREATE TABLE product_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_id INT DEFAULT NULL,
    attribute_key VARCHAR(100) NOT NULL, -- VD: 'Số trang', 'Loại bìa', 'Màu sắc'
    attribute_value VARCHAR(255) NOT NULL,
    CONSTRAINT fk_pa_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng inventory_stock_movements (Sổ cái biến động kho)
CREATE TABLE inventory_stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    created_by INT DEFAULT NULL, -- Admin thực hiện
    movement_type ENUM('IMPORT', 'EXPORT', 'ADJUSTMENT', 'RESERVE', 'CANCEL_RESERVE') NOT NULL,
    quantity INT NOT NULL,
    reference_doc_id VARCHAR(100) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ism_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ism_admin FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 6. NHÓM GIỎ HÀNG, ĐƠN HÀNG, THANH TOÁN & KHUYẾN MÃI
-- ============================================================================

-- Bảng carts (Giỏ hàng hỗ trợ Member & Guest)
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(100) DEFAULT NULL, -- Dành cho vãng lai Guest
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng cart_items (Chi tiết giỏ hàng)
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng vouchers (Mã giảm giá)
CREATE TABLE vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('FIXED_AMOUNT', 'PERCENTAGE') NOT NULL,
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_value DECIMAL(12, 2) DEFAULT 0.00,
    max_usage_total INT DEFAULT 0,
    max_usage_per_user INT DEFAULT 1,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng orders (Đơn hàng)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL, -- Cho phép NULL nếu Guest Checkout
    order_code VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('PENDING_PAYMENT', 'PENDING_CONFIRM', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING_CONFIRM',
    payment_status ENUM('UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED') DEFAULT 'UNPAID',
    shipping_status ENUM('UNSHIPPED', 'SHIPPED', 'DELIVERED', 'FAILED') DEFAULT 'UNSHIPPED',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    points_discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    shipping_fee DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    guest_name VARCHAR(150) DEFAULT NULL,
    guest_phone VARCHAR(20) DEFAULT NULL,
    guest_email VARCHAR(150) DEFAULT NULL,
    shipping_address_snapshot JSON NOT NULL, -- Snapshot địa chỉ giao hàng
    tracking_token VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_code (order_code)
) ENGINE=InnoDB;

-- Bảng order_items (Chi tiết đơn hàng - Bắt buộc lưu Snapshot)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT NOT NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    price_snapshot DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Bảng order_status_history (Lịch sử trạng thái đơn)
CREATE TABLE order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    updated_by INT DEFAULT NULL, -- Admin thực hiện cập nhật
    previous_status VARCHAR(50) DEFAULT NULL,
    new_status VARCHAR(50) NOT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_osh_admin FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng voucher_usages (Lịch sử áp dụng Voucher)
CREATE TABLE voucher_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    order_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    CONSTRAINT fk_vu_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_vu_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng payments (Giao dịch thanh toán)
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method ENUM('COD', 'BANK_TRANSFER', 'ONLINE_GATEWAY') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_code VARCHAR(100) DEFAULT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    receipt_image_url VARCHAR(500) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng shipments (Vận chuyển & Mã vận đơn)
CREATE TABLE shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    carrier_name VARCHAR(100) NOT NULL, -- GHN, GHTK, ViettelPost...
    tracking_number VARCHAR(100) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM('READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED') DEFAULT 'READY_TO_SHIP',
    shipped_at TIMESTAMP NULL DEFAULT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ship_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 7. NHÓM THƯỞNG, TƯƠNG TÁC & HỆ THỐNG
-- ============================================================================

-- Bảng loyalty_accounts (Tài khoản điểm thưởng Member)
CREATE TABLE loyalty_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    current_points INT NOT NULL DEFAULT 0,
    total_accumulated_points INT NOT NULL DEFAULT 0,
    member_tier ENUM('STANDARD', 'SILVER', 'GOLD', 'DIAMOND') DEFAULT 'STANDARD',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_la_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng point_transactions (Sổ cái biến động điểm)
CREATE TABLE point_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loyalty_account_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    point_change INT NOT NULL, -- Cộng (+ điểm) hoặc Trừ (- điểm)
    type ENUM('EARN', 'REDEEM', 'EXPIRE', 'REFUND', 'ADJUSTMENT') NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pt_account FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng reviews (Đánh giá sản phẩm)
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    rating_stars INT NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
    comment TEXT DEFAULT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng wishlists (Sản phẩm yêu thích)
CREATE TABLE wishlists (
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_wl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng notifications (Thông báo hệ thống)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    payload JSON DEFAULT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng audit_logs (Sổ cái nhật ký an toàn Admin)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
