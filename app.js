/**
 * ============================================================================
 * CHƯƠNG TRÌNH HOÀN CHỈNH NODE.JS / EXPRESS + MYSQL WORKBENCH
 * Tích hợp toàn bộ nghiệp vụ CRUD cho cả 2 Hệ thống Web
 * ============================================================================
 */

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load local server configuration without exposing credentials to the browser.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
    const envText = fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '');
    for (const line of envText.split(/\r?\n/)) {
        const entry = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (entry && process.env[entry[1]] === undefined) process.env[entry[1]] = entry[2].trim().replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
    }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Cấu hình Pool kết nối MySQL Workbench
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: 'school_book_ecosystem_full',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const teacherSessions = new Map();
const TEACHER_SESSION_TTL = 8 * 60 * 60 * 1000;
const AUTH_LOGIN_ROLES = new Set(['SUPER_ADMIN','COMPANY_ADMIN','SCHOOL_ADMIN','TEACHER','EDITOR','AUTHOR']);
const PUBLICATION_LOGIN_ROLES = new Set(['SUPER_ADMIN','SCHOOL_ADMIN','TEACHER','EDITOR','AUTHOR']);
const readUserSession = req => {
    const cookies = (req.headers.cookie || '').split(';').map(value => value.trim());
    const token = cookies.find(value => value.startsWith('account_session='))?.slice('account_session='.length)
        || cookies.find(value => value.startsWith('teacher_session='))?.slice('teacher_session='.length);
    if (!token) return null;
    const session = teacherSessions.get(token);
    if (!session || session.expiresAt <= Date.now()) { teacherSessions.delete(token); return null; }
    session.expiresAt = Date.now() + TEACHER_SESSION_TTL;
    return session;
};
const requireTeacherSession = (req, res, next) => {
    const session = readUserSession(req);
    if (!session || session.role !== 'TEACHER') return res.status(401).json({ success: false, error: 'Teacher login required.' });
    req.user = { id: session.userId, role: session.role, full_name: session.fullName };
    next();
};
const requirePublicationSession = (req, res, next) => {
    const session = readUserSession(req);
    if (!session) return res.status(401).json({ success: false, error: 'Sign in to manage publication records.' });
    if (!PUBLICATION_LOGIN_ROLES.has(session.role)) return res.status(403).json({ success: false, error: 'This role cannot manage publication records.' });
    req.user = { id: session.userId, role: session.role, full_name: session.fullName };
    next();
};
const requireStoreAdminSession = (req, res, next) => {
    const session = readUserSession(req);
    if (!session) return res.status(401).json({ success: false, error: 'Đăng nhập quản trị để xem thông tin khách hàng và đơn hàng.' });
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(session.role)) return res.status(403).json({ success: false, error: 'Vai trò này không được quản lý đơn hàng cửa hàng.' });
    req.user = { id: session.userId, role: session.role, full_name: session.fullName };
    next();
};
const verifyConfiguredSecret = (value, expected) => {
    const actualHash = crypto.createHash('sha256').update(String(value)).digest();
    const expectedHash = crypto.createHash('sha256').update(String(expected)).digest();
    return crypto.timingSafeEqual(actualHash, expectedHash);
};
app.post(['/api/v1/auth/login', '/api/v1/auth/teacher-login'], async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const role = req.path.endsWith('/teacher-login') ? 'TEACHER' : String(req.body.role || '').trim().toUpperCase();
        if (!AUTH_LOGIN_ROLES.has(role)) return res.status(400).json({ success: false, error: 'Vai trò không được hỗ trợ đăng nhập.' });
        const rolePrefix = 'AUTH_' + role + '_';
        const configuredEmail = process.env[rolePrefix + 'EMAIL'] || (role === 'TEACHER' ? process.env.TEACHER_EMAIL : '');
        const configuredPassword = process.env[rolePrefix + 'PASSWORD'] || (role === 'TEACHER' ? process.env.TEACHER_PASSWORD : '');
        if (!configuredEmail || !configuredPassword) return res.status(503).json({ success: false, error: 'This role is not configured for login in .env.' });
        if (!verifyConfiguredSecret(email, configuredEmail.trim().toLowerCase()) || !verifyConfiguredSecret(password, configuredPassword)) return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
        let user;
        if (role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') {
            // These administrator accounts are provisioned by server-side .env credentials,
            // so they do not also need a manually inserted row in the users table.
            user = {
                id: role === 'COMPANY_ADMIN' ? 'env-company-admin' : 'env-super-admin',
                full_name: role === 'COMPANY_ADMIN' ? 'Quản trị cửa hàng' : 'Quản trị hệ thống'
            };
        } else {
            const [users] = await pool.query("SELECT id, full_name FROM users WHERE LOWER(email) = ? AND role = ? AND status = 'ACTIVE' LIMIT 1", [email, role]);
            if (!users.length) return res.status(403).json({ success: false, error: 'This email is not linked to an active account with the selected role.' });
            user = users[0];
        }
        const token = crypto.randomBytes(32).toString('hex');
        teacherSessions.set(token, { userId: user.id, fullName: user.full_name, role, expiresAt: Date.now() + TEACHER_SESSION_TTL });
        res.setHeader('Set-Cookie', 'account_session=' + token + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + (TEACHER_SESSION_TTL / 1000));
        res.json({ success: true, data: { user_id: user.id, full_name: user.full_name, role } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/v1/auth/session', (req, res) => {
    const session = readUserSession(req);
    if (!session) return res.status(401).json({ success: false, error: 'Sign in required.' });
    res.json({ success: true, data: { user_id: session.userId, full_name: session.fullName, role: session.role } });
});
app.post('/api/v1/auth/logout', (req, res) => {
    const session = readUserSession(req);
    const cookies = (req.headers.cookie || '').split(';').map(value => value.trim());
    const token = cookies.find(value => value.startsWith('account_session='))?.slice('account_session='.length)
        || cookies.find(value => value.startsWith('teacher_session='))?.slice('teacher_session='.length);
    if (token) teacherSessions.delete(token);
    res.setHeader('Set-Cookie', ['account_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0', 'teacher_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0']);
    res.json({ success: true, data: session ? { role: session.role } : null });
});
app.get('/api/v1/auth/teacher-session', requireTeacherSession, (req, res) => res.json({ success: true, data: { user_id: req.user.id, role: req.user.role, full_name: req.user.full_name } }));
app.post('/api/v1/auth/teacher-logout', (req, res) => {
    const cookies = (req.headers.cookie || '').split(';').map(value => value.trim());
    const token = cookies.find(value => value.startsWith('account_session='))?.slice('account_session='.length)
        || cookies.find(value => value.startsWith('teacher_session='))?.slice('teacher_session='.length);
    if (token) teacherSessions.delete(token);
    res.setHeader('Set-Cookie', ['account_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0', 'teacher_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0']);
    res.json({ success: true });
});

// Middleware xác thực & lấy User Header
const authenticateToken = (req, res, next) => {
    req.user = {
        id: req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : 1,
        role: req.headers['x-user-role'] || 'STUDENT',
        consent_status: req.headers['x-consent'] === 'true' || true
    };
    next();
};

// Route Phục vụ Giao diện HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'clbsach', 'clb_sach_trang_chinh_sidebar_tuong_tac_giao_vien.html')));
// Legacy URL used by clients that still request the HTML from the project root.
app.get('/clb_sach_trang_chinh_sidebar_tuong_tac_giao_vien.html', (req, res) => res.sendFile(path.join(__dirname, 'clbsach', 'clb_sach_trang_chinh_sidebar_tuong_tac_giao_vien.html')));
app.get('/school-admin', (req, res) => res.sendFile(path.join(__dirname, 'clbsach', 'clb_sach_admin.html')));
app.get('/store', (req, res) => res.sendFile(path.join(__dirname, 'Websie_banhang', 'nha_sach_hebec_home.html')));
app.get('/store-admin', (req, res) => res.sendFile(path.join(__dirname, 'Websie_banhang', 'nha_sach_hebec_admin.html')));

// Seed Data khởi tạo CSDL
app.get('/api/v1/seed-data', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`INSERT IGNORE INTO organizations (id, type, name, org_code) VALUES (1, 'SCHOOL', 'THPT Nguyễn Trãi', 'THPT-NT')`);
        await conn.query(`INSERT IGNORE INTO users (id, full_name, email, password_hash, role, consent_status) VALUES (1, 'Trần Văn An', 'an.tv@gmail.com', 'hash', 'STUDENT', TRUE), (2, 'Cô Phạm Thị Mai', 'mai.pt@gmail.com', 'hash', 'TEACHER', TRUE)`);
        await conn.query(`INSERT IGNORE INTO categories (id, name, slug) VALUES (1, 'Sách Thiếu Nhi', 'sach-thieu-nhi')`);
        await conn.query(`INSERT IGNORE INTO products (id, category_id, name, slug, status) VALUES (1, 1, 'Ký Ức Dòng Sông', 'ky-uc-dong-song', 'ACTIVE')`);
        await conn.query(`INSERT IGNORE INTO product_variants (id, product_id, sku, original_price, selling_price, stock_quantity, reserved_quantity) VALUES (1, 1, 'SKU-KYUC-01', 50000, 45000, 100, 0)`);
        await conn.commit();
        res.json({ success: true, message: 'Đã tạo dữ liệu mẫu thành công!' });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ success: false, error: e.message });
    } finally { conn.release(); }
});

// ============================================================================
// CRUD 1: QUẢN LÝ TÁC PHẨM / BÀI VIẾT (WEB SÁCH HỌC ĐƯỜNG)
// ============================================================================

// Quản lý trường và câu lạc bộ trong cùng bảng organizations.
app.get('/api/v1/school/reports/schools', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT o.id, o.name,
                   (SELECT COUNT(*) FROM organizations c WHERE c.parent_id = o.id AND c.type = 'CLUB' AND c.status = 'ACTIVE') AS club_count,
                   (SELECT COUNT(*) FROM works w JOIN organizations owner ON owner.id = w.organization_id
                    WHERE (owner.id = o.id OR owner.parent_id = o.id) AND w.moderation_status IN ('DRAFT', 'PENDING')) AS works_in_progress,
                   (SELECT COUNT(*) FROM magazines m WHERE m.school_id = o.id AND m.status = 'PUBLISHED') AS published_magazines
            FROM organizations o
            WHERE o.type = 'SCHOOL'
            ORDER BY o.name, o.id
        `);
        const data = rows.map(row => ({
            ...row,
            activity_count: Number(row.club_count) + Number(row.works_in_progress) + Number(row.published_magazines)
        })).sort((a, b) => b.activity_count - a.activity_count || a.name.localeCompare(b.name, 'vi'))
          .map((row, index) => ({ ...row, rank: index + 1 }));
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/v1/school/organizations', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT o.id, o.type, o.name, o.org_code, o.parent_id, o.status, p.name AS parent_name
            FROM organizations o
            LEFT JOIN organizations p ON p.id = o.parent_id
            WHERE o.type IN ('SCHOOL', 'CLUB')
            ORDER BY CASE o.type WHEN 'SCHOOL' THEN 0 ELSE 1 END, o.name, o.id
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/v1/school/organizations', authenticateToken, async (req, res) => {
    try {
        const { type, name, org_code, parent_id } = req.body;
        const cleanName = typeof name === 'string' ? name.trim() : '';
        const cleanCode = typeof org_code === 'string' ? org_code.trim() : '';
        if (!['SCHOOL', 'CLUB'].includes(type) || !cleanName || !cleanCode) {
            return res.status(400).json({ success: false, error: 'Loại đơn vị, tên và mã đơn vị là bắt buộc.' });
        }
        let parentId = null;
        if (type === 'CLUB') {
            parentId = Number(parent_id);
            if (!Number.isInteger(parentId) || parentId <= 0) return res.status(400).json({ success: false, error: 'Vui lòng chọn trường quản lý CLB.' });
            const [schools] = await pool.query(`SELECT id FROM organizations WHERE id = ? AND type = 'SCHOOL'`, [parentId]);
            if (!schools.length) return res.status(400).json({ success: false, error: 'Trường quản lý không hợp lệ.' });
        }
        const [result] = await pool.query(
            `INSERT INTO organizations (type, name, org_code, parent_id) VALUES (?, ?, ?, ?)`,
            [type, cleanName, cleanCode, parentId]
        );
        res.status(201).json({ success: true, id: result.insertId, message: 'Đã thêm đơn vị.' });
    } catch (e) {
        const duplicate = e.code === 'ER_DUP_ENTRY';
        res.status(duplicate ? 409 : 500).json({ success: false, error: duplicate ? 'Mã đơn vị đã được sử dụng.' : e.message });
    }
});

app.put('/api/v1/school/organizations/:id', authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, org_code, parent_id, status } = req.body;
        const cleanName = typeof name === 'string' ? name.trim() : '';
        const cleanCode = typeof org_code === 'string' ? org_code.trim() : '';
        if (!Number.isInteger(id) || id <= 0 || !cleanName || !cleanCode || !['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Thông tin đơn vị cập nhật không hợp lệ.' });
        }
        const [orgs] = await pool.query(`SELECT id, type FROM organizations WHERE id = ? AND type IN ('SCHOOL', 'CLUB')`, [id]);
        if (!orgs.length) return res.status(404).json({ success: false, error: 'Không tìm thấy trường hoặc CLB.' });
        let parentId = null;
        if (orgs[0].type === 'CLUB') {
            parentId = Number(parent_id);
            if (!Number.isInteger(parentId) || parentId <= 0 || parentId === id) return res.status(400).json({ success: false, error: 'Vui lòng chọn trường quản lý hợp lệ.' });
            const [schools] = await pool.query(`SELECT id FROM organizations WHERE id = ? AND type = 'SCHOOL'`, [parentId]);
            if (!schools.length) return res.status(400).json({ success: false, error: 'Trường quản lý không hợp lệ.' });
        }
        await pool.query(`UPDATE organizations SET name = ?, org_code = ?, parent_id = ?, status = ? WHERE id = ?`, [cleanName, cleanCode, parentId, status, id]);
        res.json({ success: true, message: 'Đã cập nhật đơn vị.' });
    } catch (e) {
        const duplicate = e.code === 'ER_DUP_ENTRY';
        res.status(duplicate ? 409 : 500).json({ success: false, error: duplicate ? 'Mã đơn vị đã được sử dụng.' : e.message });
    }
});

app.delete('/api/v1/school/organizations/:id', authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, error: 'Mã đơn vị không hợp lệ.' });
        const [orgs] = await pool.query(`SELECT id FROM organizations WHERE id = ? AND type IN ('SCHOOL', 'CLUB')`, [id]);
        if (!orgs.length) return res.status(404).json({ success: false, error: 'Không tìm thấy trường hoặc CLB.' });
        const checks = [
            ['organizations', 'parent_id'], ['memberships', 'organization_id'], ['works', 'organization_id'],
            ['magazines', 'school_id'], ['competitions', 'organizer_id']
        ];
        for (const [table, column] of checks) {
            const [rows] = await pool.query(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`, [id]);
            if (rows.length) return res.status(409).json({ success: false, error: 'Đơn vị đang có dữ liệu liên quan. Hãy chuyển sang trạng thái Ngừng hoạt động thay vì xóa.' });
        }
        await pool.query(`DELETE FROM organizations WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Đã xóa đơn vị.' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// [READ] Lấy danh sách tác phẩm
app.get('/api/v1/school/members', async (req, res) => {
    try {
        const [[members], [users], [organizations]] = await Promise.all([
            pool.query(`SELECT m.id AS membership_id, m.user_id, m.organization_id, m.role_in_org, m.joined_at, u.full_name, u.email, u.phone, u.role, u.status AS user_status, o.name AS organization_name, o.type AS organization_type FROM memberships m JOIN users u ON u.id = m.user_id JOIN organizations o ON o.id = m.organization_id ORDER BY u.full_name, o.name`),
            pool.query(`SELECT id, full_name, email, phone, role, status FROM users ORDER BY full_name`),
            pool.query(`SELECT id, name, type FROM organizations WHERE type IN ('SCHOOL','CLUB') AND status = 'ACTIVE' ORDER BY name`)
        ]);
        res.json({ success: true, data: { members, users, organizations } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/v1/school/members', authenticateToken, async (req, res) => {
    try {
        const { user_id, organization_id, role_in_org, full_name, email, phone } = req.body;
        const userId = Number(user_id), orgId = Number(organization_id);
        if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(orgId) || orgId <= 0 || !String(full_name || '').trim()) {
            return res.status(400).json({ success: false, error: 'Cần chọn hồ sơ, đơn vị và nhập họ tên.' });
        }
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const [users] = await conn.query(`SELECT id FROM users WHERE id = ?`, [userId]);
            const [orgs] = await conn.query(`SELECT id FROM organizations WHERE id = ? AND type IN ('SCHOOL','CLUB') AND status = 'ACTIVE'`, [orgId]);
            if (!users.length || !orgs.length) { await conn.rollback(); return res.status(400).json({ success: false, error: 'Hồ sơ hoặc trường/CLB không hợp lệ.' }); }
            await conn.query(`UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?`, [String(full_name).trim(), email || null, phone || null, userId]);
            const [membership] = await conn.query(`INSERT INTO memberships (user_id, organization_id, role_in_org) VALUES (?, ?, ?)`, [userId, orgId, role_in_org || null]);
            await conn.commit();
            res.status(201).json({ success: true, membership_id: membership.insertId, message: 'Đã thêm thành viên vào đơn vị.' });
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    } catch (e) {
        const duplicate = e.code === 'ER_DUP_ENTRY';
        res.status(duplicate ? 409 : 500).json({ success: false, error: duplicate ? 'Thành viên này đã thuộc đơn vị được chọn.' : e.message });
    }
});

app.put('/api/v1/school/members/:id', authenticateToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const membershipId = Number(req.params.id), orgId = Number(req.body.organization_id);
        const { full_name, email, phone, role_in_org } = req.body;
        if (!Number.isInteger(membershipId) || membershipId <= 0 || !Number.isInteger(orgId) || orgId <= 0 || !String(full_name || '').trim()) {
            return res.status(400).json({ success: false, error: 'Thông tin hồ sơ thành viên không hợp lệ.' });
        }
        await conn.beginTransaction();
        const [members] = await conn.query(`SELECT user_id FROM memberships WHERE id = ?`, [membershipId]);
        if (!members.length) { await conn.rollback(); return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên.' }); }
        const [orgs] = await conn.query(`SELECT id FROM organizations WHERE id = ? AND type IN ('SCHOOL','CLUB') AND status = 'ACTIVE'`, [orgId]);
        if (!orgs.length) { await conn.rollback(); return res.status(400).json({ success: false, error: 'Trường hoặc CLB không hợp lệ.' }); }
        await conn.query(`UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?`, [String(full_name).trim(), email || null, phone || null, members[0].user_id]);
        await conn.query(`UPDATE memberships SET organization_id = ?, role_in_org = ? WHERE id = ?`, [orgId, role_in_org || null, membershipId]);
        await conn.commit();
        res.json({ success: true, message: 'Đã cập nhật hồ sơ thành viên.' });
    } catch (e) {
        await conn.rollback();
        const duplicate = e.code === 'ER_DUP_ENTRY';
        res.status(duplicate ? 409 : 500).json({ success: false, error: duplicate ? 'Thành viên này đã thuộc đơn vị được chọn hoặc email bị trùng.' : e.message });
    } finally { conn.release(); }
});

app.delete('/api/v1/school/members/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query(`DELETE FROM memberships WHERE id = ?`, [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên.' });
        res.json({ success: true, message: 'Đã gỡ thành viên khỏi đơn vị; hồ sơ người dùng vẫn được giữ.' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/v1/school/scoring-options', requireTeacherSession, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.id AS submission_id, c.id AS competition_id, c.title AS competition_title,
                   w.title AS work_title, j.id AS judge_id, u.full_name AS judge_name
            FROM submissions s
            JOIN competitions c ON c.id = s.competition_id
            JOIN works w ON w.id = s.work_id
            JOIN judges j ON j.competition_id = c.id
            JOIN users u ON u.id = j.user_id
            WHERE s.eligibility_status = 'ELIGIBLE'
              AND j.user_id = ?
            ORDER BY c.title, w.title, u.full_name
        `, [req.user.id]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/v1/school/works', async (req, res) => {
    try {
        await ensureHomepageWorksImported();
        await ensureWorkScoresTable();
        const [rows] = await pool.query(`
            SELECT w.*,
                   ws.id AS latest_score_id, ws.total_score AS latest_score, ws.criteria_json AS latest_criteria,
                   ws.reviewer_name AS latest_reviewer_name, ws.reviewer_role AS latest_reviewer_role,
                   ws.feedback AS latest_feedback
            FROM works w
            LEFT JOIN work_scores ws ON ws.id = (
                SELECT MAX(score_row.id) FROM work_scores score_row WHERE score_row.work_id = w.id
            )
            ORDER BY w.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

let workScoresTableReady;
function ensureWorkScoresTable() {
    if (!workScoresTableReady) {
        workScoresTableReady = pool.query(`CREATE TABLE IF NOT EXISTS work_scores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            work_id INT NOT NULL,
            criteria_json JSON NOT NULL,
            total_score DECIMAL(5,2) NOT NULL,
            reviewer_name VARCHAR(120) NOT NULL,
            reviewer_role VARCHAR(120) DEFAULT NULL,
            feedback TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_work_scores_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            INDEX idx_work_scores_work_created (work_id, created_at),
            CHECK (total_score BETWEEN 0 AND 100)
        ) ENGINE=InnoDB`).catch(error => { workScoresTableReady = null; throw error; });
    }
    return workScoresTableReady;
}

// Save rubric scores without account authentication; reviewer details are entered with the score.
app.post('/api/v1/school/works/:id/score', async (req, res) => {
    try {
        const workId = Number(req.params.id);
        const reviewerName = String(req.body.reviewer_name || '').trim();
        const reviewerRole = String(req.body.reviewer_role || '').trim();
        const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
        const criteria = req.body.criteria;
        const weights = [0.25, 0.25, 0.20, 0.20, 0.10];
        if (!Number.isInteger(workId) || workId <= 0 || !Array.isArray(criteria) || criteria.length !== 5 ||
            criteria.some((item, index) => !item || typeof item.name !== 'string' || !Number.isFinite(Number(item.score)) || Number(item.score) < 0 || Number(item.score) > 100 || Number(item.weight) !== weights[index]) ||
            reviewerName.length < 2 || reviewerName.length > 120 || reviewerRole.length > 120) {
            return res.status(400).json({ success: false, error: 'Nhập đủ 5 tiêu chí từ 0 đến 100 và tên người chấm (2–120 ký tự).' });
        }
        await ensureWorkScoresTable();
        const [works] = await pool.query('SELECT id FROM works WHERE id = ?', [workId]);
        if (!works.length) return res.status(404).json({ success: false, error: 'Không tìm thấy tác phẩm.' });
        const normalizedCriteria = criteria.map((item, index) => ({ name: item.name.slice(0, 120), weight: weights[index], score: Number(item.score) }));
        const total = normalizedCriteria.reduce((sum, item) => sum + item.score * item.weight, 0);
        const scoreId = Number(req.body.score_id) || 0;
        if (scoreId > 0) {
            const [existingScores] = await pool.query('SELECT id FROM work_scores WHERE id = ? AND work_id = ?', [scoreId, workId]);
            if (!existingScores.length) return res.status(404).json({ success: false, error: 'Score record not found for this work.' });
            await pool.query(
                'UPDATE work_scores SET criteria_json = ?, total_score = ?, reviewer_name = ?, reviewer_role = ?, feedback = ? WHERE id = ? AND work_id = ?',
                [JSON.stringify(normalizedCriteria), total.toFixed(2), reviewerName, reviewerRole || null, feedback || null, scoreId, workId]
            );
            return res.json({ success: true, id: scoreId, total_score: Number(total.toFixed(2)), message: 'Score updated.' });
        }
        const [result] = await pool.query(
            'INSERT INTO work_scores (work_id, criteria_json, total_score, reviewer_name, reviewer_role, feedback) VALUES (?, ?, ?, ?, ?, ?)',
            [workId, JSON.stringify(normalizedCriteria), total.toFixed(2), reviewerName, reviewerRole || null, feedback || null]
        );
        res.status(201).json({ success: true, id: result.insertId, total_score: Number(total.toFixed(2)), message: 'Score saved.' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Approval from Work Progress does not require a score.
app.put('/api/v1/school/works/:id/approval', async (req, res) => {
    try {
        const workId = Number(req.params.id);
        const decision = req.body.decision;
        if (!Number.isInteger(workId) || workId <= 0 || !['APPROVED', 'REJECTED'].includes(decision)) {
            return res.status(400).json({ success: false, error: 'Invalid approval status.' });
        }
        const [result] = await pool.query('UPDATE works SET moderation_status = ? WHERE id = ?', [decision, workId]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Work not found.' });
        res.json({ success: true, message: decision === 'APPROVED' ? 'Work approved.' : 'Work returned for revision.' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const PUBLICATION_STATUSES = ['DRAFT','READY_TO_SEND','SENT_TO_PARTNER','REVISION_REQUIRED','PARTNER_ACCEPTED','PUBLISHED_CONFIRMED'];
let publicationTablesReady;
function ensurePublicationTables() {
    if (!publicationTablesReady) {
        publicationTablesReady = (async () => {
            await pool.query(`CREATE TABLE IF NOT EXISTS publication_partners (
                id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, partner_type VARCHAR(80) NOT NULL,
                specialty VARCHAR(255) DEFAULT NULL, contact_name VARCHAR(150) DEFAULT NULL, email VARCHAR(190) DEFAULT NULL,
                phone VARCHAR(40) DEFAULT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB`);
            await pool.query(`CREATE TABLE IF NOT EXISTS publication_workflows (
                work_id INT PRIMARY KEY, status ENUM('DRAFT','READY_TO_SEND','SENT_TO_PARTNER','REVISION_REQUIRED','PARTNER_ACCEPTED','PUBLISHED_CONFIRMED') NOT NULL DEFAULT 'DRAFT',
                checklist_json JSON NOT NULL, partner_id INT DEFAULT NULL, isbn VARCHAR(32) DEFAULT NULL, publisher_name VARCHAR(255) DEFAULT NULL,
                sent_at DATE DEFAULT NULL, response_at DATE DEFAULT NULL, response_note TEXT DEFAULT NULL,
                confirmation_name VARCHAR(150) DEFAULT NULL, confirmation_date DATE DEFAULT NULL, notes TEXT DEFAULT NULL,
                updated_by INT DEFAULT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_pub_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
                CONSTRAINT fk_pub_partner FOREIGN KEY (partner_id) REFERENCES publication_partners(id) ON DELETE SET NULL
            ) ENGINE=InnoDB`);
            await pool.query(`CREATE TABLE IF NOT EXISTS publication_workflow_events (
                id INT AUTO_INCREMENT PRIMARY KEY, work_id INT NOT NULL, event_type VARCHAR(40) NOT NULL,
                event_date DATE DEFAULT NULL, detail TEXT DEFAULT NULL, created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_pub_event_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
                INDEX idx_pub_event_work_date (work_id, event_date, id)
            ) ENGINE=InnoDB`);
            await pool.query(`CREATE TABLE IF NOT EXISTS publication_files (
                id INT AUTO_INCREMENT PRIMARY KEY, work_id INT NOT NULL,
                doc_type ENUM('MASTER','APPROVAL','PARTNER_RESPONSE','PUBLICATION_CONFIRMATION','OTHER') NOT NULL,
                file_name VARCHAR(255) NOT NULL, storage_name VARCHAR(80) NOT NULL UNIQUE, mime_type VARCHAR(150) DEFAULT NULL,
                file_size BIGINT UNSIGNED NOT NULL, uploaded_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_pub_file_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
                INDEX idx_pub_file_work_type (work_id, doc_type)
            ) ENGINE=InnoDB`);
        })().catch(error => { publicationTablesReady = null; throw error; });
    }
    return publicationTablesReady;
}
function publicationDateIsValid(value) { return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))); }

app.get('/api/v1/school/publications', requirePublicationSession, async (req, res) => {
    try {
        await ensureHomepageWorksImported(); await ensurePublicationTables();
        await pool.query("INSERT IGNORE INTO publication_workflows (work_id, checklist_json) SELECT id, JSON_OBJECT('authors', false, 'rights', false, 'sources', false, 'editing', false, 'design', false, 'publicationInfo', false) FROM works WHERE moderation_status = 'APPROVED'");
        const [rows] = await pool.query("SELECT w.id AS work_id, w.title, w.content_type, w.category, (SELECT GROUP_CONCAT(u.full_name ORDER BY wa.is_primary DESC SEPARATOR ', ') FROM work_authors wa JOIN users u ON u.id=wa.user_id WHERE wa.work_id=w.id) AS author_names, p.status, p.checklist_json, p.partner_id, pr.name AS partner_name, pr.partner_type, pr.specialty, p.isbn, p.publisher_name, DATE_FORMAT(p.sent_at, '%Y-%m-%d') AS sent_at, DATE_FORMAT(p.response_at, '%Y-%m-%d') AS response_at, p.response_note, p.confirmation_name, DATE_FORMAT(p.confirmation_date, '%Y-%m-%d') AS confirmation_date, p.notes, p.updated_at FROM works w JOIN publication_workflows p ON p.work_id = w.id LEFT JOIN publication_partners pr ON pr.id = p.partner_id WHERE w.moderation_status = 'APPROVED' ORDER BY p.updated_at DESC, w.id DESC");
        const data = rows.map(row => ({ ...row, checklist_json: typeof row.checklist_json === 'string' ? JSON.parse(row.checklist_json) : row.checklist_json }));
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/v1/school/publication-partners', requirePublicationSession, async (req, res) => {
    try { await ensurePublicationTables(); const [rows] = await pool.query('SELECT * FROM publication_partners WHERE active = TRUE ORDER BY name'); res.json({ success: true, data: rows }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/api/v1/school/publication-partners', requirePublicationSession, async (req, res) => {
    try {
        await ensurePublicationTables(); const name=String(req.body.name||'').trim(), partnerType=String(req.body.partner_type||'').trim();
        const specialty=String(req.body.specialty||'').trim(), contact=String(req.body.contact_name||'').trim(), email=String(req.body.email||'').trim(), phone=String(req.body.phone||'').trim();
        if(name.length<2||name.length>255||partnerType.length<2||partnerType.length>80||specialty.length>255||contact.length>150||email.length>190||phone.length>40) return res.status(400).json({success:false,error:'Enter a valid publishing partner profile.'});
        const [result]=await pool.query('INSERT INTO publication_partners (name,partner_type,specialty,contact_name,email,phone) VALUES (?,?,?,?,?,?)',[name,partnerType,specialty||null,contact||null,email||null,phone||null]);
        res.status(201).json({success:true,id:result.insertId,message:'Publishing partner saved.'});
    } catch(e){res.status(500).json({success:false,error:e.message});}
});
app.put('/api/v1/school/publications/:workId', requirePublicationSession, async (req, res) => {
    try {
        await ensurePublicationTables(); const workId=Number(req.params.workId), action=String(req.body.action||'SAVE');
        if(!Number.isInteger(workId)||workId<=0||!['SAVE','MARK_READY','MARK_SENT','RECORD_RESPONSE','CONFIRM_PUBLISHED'].includes(action)) return res.status(400).json({success:false,error:'Invalid publishing workflow action.'});
        const checklist=req.body.checklist||{}; const checklistKeys=['authors','rights','sources','editing','design','publicationInfo'];
        if(checklistKeys.some(key=>typeof checklist[key]!=='boolean')) return res.status(400).json({success:false,error:'Complete each preflight checklist item as checked or unchecked.'});
        const partnerId=req.body.partner_id?Number(req.body.partner_id):null;
        const isbn=String(req.body.isbn||'').trim(), publisherName=String(req.body.publisher_name||'').trim();
        const sentAt=String(req.body.sent_at||'').trim(), responseAt=String(req.body.response_at||'').trim();
        const responseNote=String(req.body.response_note||'').trim(), confirmationName=String(req.body.confirmation_name||'').trim(), confirmationDate=String(req.body.confirmation_date||'').trim(), notes=String(req.body.notes||'').trim();
        if((partnerId!==null&&(!Number.isInteger(partnerId)||partnerId<=0))||isbn.length>32||publisherName.length>255||responseNote.length>5000||confirmationName.length>150||notes.length>5000||!publicationDateIsValid(sentAt)||!publicationDateIsValid(responseAt)||!publicationDateIsValid(confirmationDate)) return res.status(400).json({success:false,error:'Check partner information, dates and field lengths.'});
        const conn=await pool.getConnection();
        try {
            await conn.beginTransaction();
            const [works]=await conn.query("SELECT id FROM works WHERE id=? AND moderation_status='APPROVED' FOR UPDATE",[workId]);
            if(!works.length){await conn.rollback();return res.status(404).json({success:false,error:'Only approved works can enter this workflow.'});}
            await conn.query("INSERT IGNORE INTO publication_workflows (work_id,checklist_json) VALUES (?,JSON_OBJECT('authors',false,'rights',false,'sources',false,'editing',false,'design',false,'publicationInfo',false))",[workId]);
            const [rows]=await conn.query('SELECT status FROM publication_workflows WHERE work_id=? FOR UPDATE',[workId]); const status=rows[0].status;
            if(partnerId){const [partners]=await conn.query('SELECT id FROM publication_partners WHERE id=? AND active=TRUE',[partnerId]);if(!partners.length){await conn.rollback();return res.status(400).json({success:false,error:'Select an active publishing partner.'});}}
            let nextStatus=status; let eventType=null; let eventDate=null; let eventDetail=null;
            if(action==='MARK_READY'){
                if(!checklistKeys.every(key=>checklist[key])||!partnerId){await conn.rollback();return res.status(400).json({success:false,error:'Complete all six preflight checks and select a suitable publishing partner.'});}
                const [masters]=await conn.query("SELECT id FROM publication_files WHERE work_id=? AND doc_type='MASTER' LIMIT 1",[workId]);
                if(!masters.length){await conn.rollback();return res.status(400).json({success:false,error:'Upload the master file before marking the package ready.'});}
                if(!['DRAFT','REVISION_REQUIRED','READY_TO_SEND'].includes(status)){await conn.rollback();return res.status(409).json({success:false,error:'Preflight can only be completed before or after partner revision.'});}
                nextStatus='READY_TO_SEND'; eventType='PREFLIGHT_READY'; eventDetail='Preflight complete; master file and partner selected.';
            } else if(action==='MARK_SENT'){
                if(status!=='READY_TO_SEND'||!sentAt){await conn.rollback();return res.status(400).json({success:false,error:'A ready package and sent date are required.'});}
                nextStatus='SENT_TO_PARTNER'; eventType='SENT_TO_PARTNER'; eventDate=sentAt; eventDetail='Sent to partner #'+partnerId;
            } else if(action==='RECORD_RESPONSE'){
                const decision=req.body.response_decision;
                if(!['SENT_TO_PARTNER','REVISION_REQUIRED'].includes(status)||!responseAt||!['REVISION_REQUIRED','PARTNER_ACCEPTED'].includes(decision)){await conn.rollback();return res.status(400).json({success:false,error:'Record a dated partner response as revision required or accepted.'});}
                if(decision==='PARTNER_ACCEPTED'){const [proof]=await conn.query("SELECT id FROM publication_files WHERE work_id=? AND doc_type IN ('APPROVAL','PARTNER_RESPONSE') LIMIT 1",[workId]);if(!proof.length){await conn.rollback();return res.status(400).json({success:false,error:'Upload the partner approval or response document before recording acceptance.'});}}
                nextStatus=decision; eventType='PARTNER_RESPONSE'; eventDate=responseAt; eventDetail=decision+(responseNote?': '+responseNote:'');
            } else if(action==='CONFIRM_PUBLISHED'){
                if(status!=='PARTNER_ACCEPTED'||!partnerId||confirmationName.length<2||!confirmationDate){await conn.rollback();return res.status(400).json({success:false,error:'Only an accepted package can be marked published, with the authorized confirmer name and confirmation date.'});}
                const [proof]=await conn.query("SELECT id FROM publication_files WHERE work_id=? AND doc_type='PUBLICATION_CONFIRMATION' LIMIT 1",[workId]);if(!proof.length){await conn.rollback();return res.status(400).json({success:false,error:'Upload a publication confirmation from the authorized partner first.'});}
                nextStatus='PUBLISHED_CONFIRMED'; eventType='PUBLICATION_CONFIRMED'; eventDate=confirmationDate; eventDetail='Authorized confirmation by '+confirmationName;
            }
            await conn.query('UPDATE publication_workflows SET status=?, checklist_json=?, partner_id=?, isbn=?, publisher_name=?, sent_at=?, response_at=?, response_note=?, confirmation_name=?, confirmation_date=?, notes=?, updated_by=? WHERE work_id=?',[nextStatus,JSON.stringify(checklist),partnerId,isbn||null,publisherName||null,sentAt||null,responseAt||null,responseNote||null,confirmationName||null,confirmationDate||null,notes||null,req.user.id,workId]);
            if(eventType) await conn.query('INSERT INTO publication_workflow_events (work_id,event_type,event_date,detail,created_by) VALUES (?,?,?,?,?)',[workId,eventType,eventDate,eventDetail,req.user.id]);
            await conn.commit(); res.json({success:true,status:nextStatus,message:nextStatus==='PUBLISHED_CONFIRMED'?'Publication recorded with partner confirmation evidence.':'Publishing workflow saved.'});
        } catch(error){await conn.rollback();throw error;} finally{conn.release();}
    } catch(e){res.status(500).json({success:false,error:e.message});}
});
app.get('/api/v1/school/publication-events', requirePublicationSession, async (req,res)=>{
    try{await ensurePublicationTables();const [rows]=await pool.query('SELECT id,work_id,event_type,event_date,detail,created_at FROM publication_workflow_events ORDER BY event_date DESC,id DESC');res.json({success:true,data:rows});}
    catch(e){res.status(500).json({success:false,error:e.message});}
});
app.get('/api/v1/school/publication-files', requirePublicationSession, async (req,res)=>{
    try{await ensurePublicationTables();const [rows]=await pool.query('SELECT id,work_id,doc_type,file_name,mime_type,file_size,created_at FROM publication_files ORDER BY created_at DESC');res.json({success:true,data:rows});}
    catch(e){res.status(500).json({success:false,error:e.message});}
});
app.post('/api/v1/school/publications/:workId/files', requirePublicationSession, express.raw({type:'application/octet-stream',limit:'100mb'}), async (req,res)=>{
    const path=require('path');const fs=require('fs/promises');let targetPath;
    try{
        await ensurePublicationTables();const workId=Number(req.params.workId),docType=String(req.headers['x-document-type']||'');
        let rawName=String(req.headers['x-file-name']||'');try{rawName=decodeURIComponent(rawName)}catch(_){}const originalName=path.basename(rawName).replace(/[\\/\\\\]/g,'').slice(0,255);const extension=path.extname(originalName).toLowerCase();
        const allowedExtensions=new Set(['.pdf','.doc','.docx','.odt','.rtf','.txt','.md','.indd','.idml','.ai','.psd','.eps','.png','.jpg','.jpeg','.zip']);
        if(!Number.isInteger(workId)||workId<=0||!['MASTER','APPROVAL','PARTNER_RESPONSE','PUBLICATION_CONFIRMATION','OTHER'].includes(docType)||!originalName||!allowedExtensions.has(extension)||!Buffer.isBuffer(req.body)||req.body.length===0)return res.status(400).json({success:false,error:'Unsupported file or missing upload data.'});
        const [works]=await pool.query("SELECT id FROM works WHERE id=? AND moderation_status='APPROVED'",[workId]);if(!works.length)return res.status(404).json({success:false,error:'Approved work not found.'});
        const directory=path.join(__dirname,'.publication-archive');await fs.mkdir(directory,{recursive:true});const storageName=crypto.randomBytes(24).toString('hex');targetPath=path.join(directory,storageName+extension);await fs.writeFile(targetPath,req.body,{flag:'wx'});
        const [result]=await pool.query('INSERT INTO publication_files (work_id,doc_type,file_name,storage_name,mime_type,file_size,uploaded_by) VALUES (?,?,?,?,?,?,?)',[workId,docType,originalName,storageName+extension,String(req.headers['content-type']||'application/octet-stream').slice(0,150),req.body.length,req.user.id]);
        res.status(201).json({success:true,id:result.insertId,message:'File archived.'});
    }catch(e){if(targetPath)try{await require('fs/promises').unlink(targetPath)}catch(_){}res.status(500).json({success:false,error:e.message});}
});
app.get('/api/v1/school/publication-files/:id/download', requirePublicationSession, async (req,res)=>{
    try{await ensurePublicationTables();const [rows]=await pool.query('SELECT file_name,storage_name FROM publication_files WHERE id=?',[req.params.id]);if(!rows.length)return res.status(404).json({success:false,error:'File not found.'});const path=require('path');res.download(path.join(__dirname,'.publication-archive',rows[0].storage_name),rows[0].file_name);}
    catch(e){res.status(500).json({success:false,error:e.message});}
});

// [CREATE] Tạo tác phẩm mới
app.post('/api/v1/school/works', authenticateToken, async (req, res) => {
    try {
        const { title, content_type, body, age_group, category } = req.body;
        const [res1] = await pool.query(
            `INSERT INTO works (title, content_type, organization_id, body, age_group, category, moderation_status, visibility) VALUES (?, ?, 1, ?, ?, ?, 'PENDING', 'SCHOOL')`,
            [title, content_type || 'STORY', body, age_group, category]
        );
        await pool.query(`INSERT INTO work_authors (work_id, user_id, is_primary) VALUES (?, ?, TRUE)`, [res1.insertId, req.user.id]);
        res.status(201).json({ success: true, message: 'Tạo tác phẩm thành công!', work_id: res1.insertId });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// [UPDATE] Cập nhật trạng thái duyệt / chỉnh sửa tác phẩm
app.put('/api/v1/school/works/:id', requireTeacherSession, async (req, res) => {
    try {
        const { title, moderation_status } = req.body;
        if (moderation_status) return res.status(400).json({ success: false, error: 'Dùng thao tác chấm và duyệt để cập nhật trạng thái tác phẩm.' });
        const [result] = await pool.query(`UPDATE works SET title = COALESCE(?, title) WHERE id = ?`, [title, req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Không tìm thấy tác phẩm.' });
        res.json({ success: true, message: 'Cập nhật tác phẩm thành công!' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// [DELETE] Xóa tác phẩm
app.delete('/api/v1/school/works/:id', requireTeacherSession, async (req, res) => {
    try {
        await pool.query(`DELETE FROM works WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa tác phẩm khỏi CSDL!' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

let workReviewTableReady;
let homepageWorksImportReady;
function ensureHomepageWorksImported() {
    if (!homepageWorksImportReady) {
        const homepageWorks = [
            {
                title: '\u0043on C\u00f3 Th\u1ec3 T\u1ef1 L\u00e0m',
                contentType: 'STORY',
                category: 'Cu\u1ed9c Thi Vi\u1ebft',
                body: 'T\u00e1c ph\u1ea9m \u0111ang hi\u1ec3n th\u1ecb trong b\u1ea3ng x\u1ebfp h\u1ea1ng trang ch\u1ee7. Nh\u00f3m t\u00e1c gi\u1ea3: H\u1ecdc sinh kh\u1ed1i 11.'
            },
            {
                title: 'T\u1ea1p Ch\u00ed S\u00e1ng T\u1ea1o S\u1ed1 10',
                contentType: 'ARTICLE',
                category: 'T\u1ea1p ch\u00ed tr\u01b0\u1eddng',
                body: 'T\u00e1c ph\u1ea9m \u0111ang hi\u1ec3n th\u1ecb trong b\u1ea3ng x\u1ebfp h\u1ea1ng trang ch\u1ee7. \u0110\u01a1n v\u1ecb: CLB THPT H\u1ed3ng Quang.'
            },
            {
                title: 'G\u00f3c Nh\u00ecn Tu\u1ed5i Tr\u1ebb',
                contentType: 'ARTICLE',
                category: 'B\u00e0i vi\u1ebft',
                body: 'T\u00e1c ph\u1ea9m \u0111ang hi\u1ec3n th\u1ecb trong b\u1ea3ng x\u1ebfp h\u1ea1ng trang ch\u1ee7. T\u00e1c gi\u1ea3 hi\u1ec3n th\u1ecb: L\u00ea Minh Nam.'
            }
        ];
        homepageWorksImportReady = (async () => {
            for (const work of homepageWorks) {
                await pool.query(`
                    INSERT INTO works (title, content_type, organization_id, body, category, moderation_status, visibility)
                    SELECT ?, ?, 1, ?, ?, 'PENDING', 'SCHOOL'
                    WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 1)
                      AND NOT EXISTS (SELECT 1 FROM works WHERE title = ? AND category = ?)
                `, [work.title, work.contentType, work.body, work.category, work.title, work.category]);
            }
        })().catch(error => { homepageWorksImportReady = null; throw error; });
    }
    return homepageWorksImportReady;
}

function ensureWorkReviewTable() {
    if (!workReviewTableReady) {
        workReviewTableReady = pool.query(`CREATE TABLE IF NOT EXISTS work_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            work_id INT NOT NULL,
            teacher_id INT NOT NULL,
            score DECIMAL(5,2) NOT NULL,
            feedback TEXT DEFAULT NULL,
            decision ENUM('APPROVED','REJECTED') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_wr_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            CONSTRAINT fk_wr_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uk_work_teacher_review (work_id, teacher_id),
            CHECK (score BETWEEN 0 AND 100)
        ) ENGINE=InnoDB`).catch(error => { workReviewTableReady = null; throw error; });
    }
    return workReviewTableReady;
}

let guestWorkReviewTableReady;
function ensureGuestWorkReviewTable() {
    if (!guestWorkReviewTableReady) {
        guestWorkReviewTableReady = pool.query(`CREATE TABLE IF NOT EXISTS guest_work_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY, work_id INT NOT NULL, reviewer_name VARCHAR(120) NOT NULL,
            reviewer_role VARCHAR(120) DEFAULT NULL, score DECIMAL(5,2) NOT NULL, feedback TEXT DEFAULT NULL,
            decision ENUM('APPROVED','REJECTED') NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_gwr_work FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            INDEX idx_gwr_work_created (work_id, created_at), CHECK (score BETWEEN 0 AND 100)
        ) ENGINE=InnoDB`).catch(error => { guestWorkReviewTableReady = null; throw error; });
    }
    return guestWorkReviewTableReady;
}

// Guest review mode: the reviewer supplies a name; no account identity is checked.
app.get('/api/v1/school/teacher/works', async (req, res) => {
    try {
        await ensureHomepageWorksImported();
        await ensureGuestWorkReviewTable();
        const [rows] = await pool.query(`
            SELECT w.id, w.title, w.content_type, w.body, w.moderation_status, w.created_at,
                   (SELECT u.full_name FROM work_authors wa JOIN users u ON u.id = wa.user_id WHERE wa.work_id = w.id ORDER BY wa.is_primary DESC LIMIT 1) AS author_name,
                   gwr.score, gwr.feedback, gwr.decision, gwr.reviewer_name, gwr.reviewer_role
            FROM works w LEFT JOIN guest_work_reviews gwr ON gwr.id = (SELECT MAX(g.id) FROM guest_work_reviews g WHERE g.work_id = w.id)
            ORDER BY w.created_at DESC, w.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/v1/school/teacher/works/:id/review', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const workId = Number(req.params.id), score = Number(req.body.score), decision = req.body.decision;
        const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
        const reviewerName = String(req.body.reviewer_name || '').trim();
        const reviewerRole = String(req.body.reviewer_role || '').trim();
        if (!Number.isInteger(workId) || workId <= 0 || !Number.isFinite(score) || score < 0 || score > 100 || !['APPROVED','REJECTED'].includes(decision) || reviewerName.length < 2 || reviewerName.length > 120 || reviewerRole.length > 120) {
            return res.status(400).json({ success: false, error: 'Nhap ten nguoi cham va diem tu 0 den 100; vai tro toi da 120 ky tu.' });
        }
        await ensureGuestWorkReviewTable();
        await conn.beginTransaction();
        const [works] = await conn.query(`SELECT id FROM works WHERE id = ?`, [workId]);
        if (!works.length) { await conn.rollback(); return res.status(404).json({ success: false, error: 'Khong tim thay tac pham.' }); }
        await conn.query(`UPDATE works SET moderation_status = ? WHERE id = ?`, [decision, workId]);
        await conn.query(`INSERT INTO guest_work_reviews (work_id, reviewer_name, reviewer_role, score, feedback, decision) VALUES (?, ?, ?, ?, ?, ?)`, [workId, reviewerName, reviewerRole || null, score, feedback || null, decision]);
        await conn.commit();
        res.json({ success: true, message: decision === 'APPROVED' ? 'Da duyet va luu diem tac pham.' : 'Da yeu cau chinh sua va luu diem.' });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ success: false, error: e.message });
    } finally { conn.release(); }
});

// AI Book Coach gợi ý
app.post('/api/v1/school/ai-book-coach/generate-outline', authenticateToken, async (req, res) => {
    try {
        const { title } = req.body;
        const outline = { suggested_title: title, chapters: ['Chương 1: Mở đầu', 'Chương 2: Phát triển', 'Chương 3: Tổng kết'] };
        await pool.query(`INSERT INTO ai_interactions (user_id, module, input_context, output, model_used) VALUES (?, 'AI_COACH', ?, ?, 'gpt-4o')`, [req.user.id, title, JSON.stringify(outline)]);
        res.json({ success: true, data: outline });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Chấm điểm cuộc thi
app.post('/api/v1/school/competitions/score', requireTeacherSession, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { submission_id, judge_id, scores_array, comment } = req.body;
        const submissionId = Number(submission_id), judgeId = Number(judge_id);
        if (!Number.isInteger(submissionId) || submissionId <= 0 || !Number.isInteger(judgeId) || judgeId <= 0 || !Array.isArray(scores_array) || scores_array.length === 0) {
            return res.status(400).json({ success: false, error: 'Chọn bài dự thi, giám khảo và nhập điểm trước khi lưu.' });
        }
        if (scores_array.some(item => !item.rubric_item || !Number.isFinite(Number(item.score)) || Number(item.score) < 0 || Number(item.score) > 100)) {
            return res.status(400).json({ success: false, error: 'Mỗi tiêu chí cần có điểm từ 0 đến 100.' });
        }
        const [valid] = await conn.query(`SELECT 1 FROM submissions s JOIN judges j ON j.competition_id = s.competition_id WHERE s.id = ? AND j.id = ? AND j.user_id = ? AND s.eligibility_status = 'ELIGIBLE'`, [submissionId, judgeId, req.user.id]);
        if (!valid.length) return res.status(400).json({ success: false, error: 'Bài dự thi hoặc giám khảo không hợp lệ.' });
        await conn.beginTransaction();
        for (const item of scores_array) {
            await conn.query(`INSERT INTO scores (submission_id, judge_id, rubric_item, score, comment) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score), comment = VALUES(comment)`, [submissionId, judgeId, String(item.rubric_item).slice(0, 100), Number(item.score), comment || null]);
        }
        await conn.commit();
        res.json({ success: true, message: 'Lưu điểm chấm thành công!' });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ success: false, error: e.message });
    } finally { conn.release(); }
});

// ============================================================================
// CRUD 2: QUẢN LÝ SẢN PHẨM & ĐƠN HÀNG (WEB NHÀ SÁCH TMĐT)
// ============================================================================

// [READ] Lấy danh sách sản phẩm
const DEFAULT_STORE_BOOKS = [
    ['Hoạt động trải nghiệm 3 – Kết nối tri thức với cuộc sống', 14000, 'Sách giáo khoa', '01.webp'],
    ['Mĩ thuật 3 – Kết nối tri thức với cuộc sống', 7900, 'Sách giáo khoa', '02.webp'],
    ['Hoạt động trải nghiệm, hướng nghiệp 7 – Kết nối tri thức với cuộc sống', 8100, 'Sách giáo khoa', '03.webp'],
    ['Mĩ thuật 6 – Kết nối tri thức với cuộc sống', 8400, 'Sách giáo khoa', '04.webp'],
    ['Lịch sử và Địa lí 5 – Kết nối tri thức với cuộc sống', 15500, 'Sách giáo khoa', '05.webp'],
    ['Mĩ thuật 5 – Kết nối tri thức với cuộc sống', 7900, 'Sách giáo khoa', '06.webp'],
    ['Toán 5 Tập 2 – Kết nối tri thức với cuộc sống', 17500, 'Sách giáo khoa', '07.webp'],
    ['Toán 5 Tập 1 – Kết nối tri thức với cuộc sống', 18000, 'Sách giáo khoa', '08.webp'],
    ['Hoạt động trải nghiệm 4 – Kết nối tri thức với cuộc sống', 12200, 'Sách giáo khoa', '09.webp'],
    ['Âm nhạc 4 Sách học sinh – Kết nối tri thức với cuộc sống', 8400, 'Sách giáo khoa', '10.webp'],
    ['Lịch sử và Địa lí 4 – Kết nối tri thức với cuộc sống', 16000, 'Sách giáo khoa', '11.webp'],
    ['Giáo dục thể chất 4 – Kết nối tri thức với cuộc sống', 11700, 'Sách giáo khoa', '12.webp'],
    ['Truyện tranh SN Anh - Việt - Bé học tính chăm chỉ', 26000, 'Sách thiếu nhi', '13.webp'],
    ['Đề kiểm tra TOÁN 4 học kì 2 (Kết nối tri thức với cuộc sống)', 40000, 'Sách tham khảo', '14.webp'],
    ['Đạo đức 3 – Kết nối tri thức với cuộc sống', 8400, 'Sách giáo khoa', '15.webp'],
    ['Truyện tranh SN Anh - Việt - Bé tìm hiểu về thiên nhiên (Discovering Nature)', 26000, 'Manga - Comic', '16.webp']
];

async function ensureDefaultStoreBooks() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const categoryIds = new Map();
        for (const categoryName of [...new Set(DEFAULT_STORE_BOOKS.map(book => book[2]))]) {
            const slug = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            await conn.query('INSERT INTO categories (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [categoryName, slug]);
            const [[category]] = await conn.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]);
            categoryIds.set(categoryName, category.id);
        }
        for (let index = 0; index < DEFAULT_STORE_BOOKS.length; index++) {
            const [name, price, categoryName, imageName] = DEFAULT_STORE_BOOKS[index];
            const sku = `HEBEC-BOOK-${String(index + 1).padStart(2, '0')}`;
            const [[existing]] = await conn.query('SELECT p.id AS product_id, v.id AS variant_id FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.sku = ? LIMIT 1', [sku]);
            let productId = existing?.product_id;
            let variantId = existing?.variant_id;
            if (!existing) {
                const slugBase = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 220);
                const [productResult] = await conn.query("INSERT INTO products (category_id, product_type, name, slug, status) VALUES (?, 'BOOK', ?, ?, 'ACTIVE')", [categoryIds.get(categoryName), name, `${slugBase}-${String(index + 1).padStart(2, '0')}`]);
                productId = productResult.insertId;
                const [variantResult] = await conn.query("INSERT INTO product_variants (product_id, sku, original_price, selling_price, stock_quantity, reserved_quantity, status) VALUES (?, ?, ?, ?, 50, 0, 'ACTIVE')", [productId, sku, price, price]);
                variantId = variantResult.insertId;
            }
            const imagePath = `products/${imageName}`;
            const [[attribute]] = await conn.query("SELECT id FROM product_attributes WHERE product_id = ? AND variant_id = ? AND attribute_key = 'image_path' LIMIT 1", [productId, variantId]);
            if (attribute) await conn.query('UPDATE product_attributes SET attribute_value = ? WHERE id = ?', [imagePath, attribute.id]);
            else await conn.query("INSERT INTO product_attributes (product_id, variant_id, attribute_key, attribute_value) VALUES (?, ?, 'image_path', ?)", [productId, variantId, imagePath]);
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally { conn.release(); }
}

const isValidStoreCoverName = value => typeof value === 'string' && (/^\d{2}\.webp$/.test(value) || /^cover-[a-f0-9]{24}\.(?:jpg|png|webp)$/.test(value));

app.post('/api/v1/store/product-covers', requireStoreAdminSession, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req, res) => {
    try {
        const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) return res.status(400).json({ success: false, error: 'Chọn ảnh JPEG, PNG hoặc WebP trước khi tải lên.' });
        const isJpeg = mime === 'image/jpeg' && body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
        const isPng = mime === 'image/png' && body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        const isWebp = mime === 'image/webp' && body.length >= 12 && body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WEBP';
        if (!isJpeg && !isPng && !isWebp) return res.status(400).json({ success: false, error: 'Định dạng ảnh không khớp hoặc ảnh bị lỗi.' });
        const extension = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
        const imageName = `cover-${crypto.randomBytes(12).toString('hex')}.${extension}`;
        const imageDirectory = path.join(__dirname, 'Websie_banhang', 'assets', 'products');
        await fs.promises.mkdir(imageDirectory, { recursive: true });
        await fs.promises.writeFile(path.join(imageDirectory, imageName), body, { flag: 'wx' });
        res.status(201).json({ success: true, data: { image_name: imageName, image_path: `products/${imageName}` } });
    } catch (error) {
        res.status(error.status === 413 ? 413 : 500).json({ success: false, error: error.status === 413 ? 'Ảnh vượt quá giới hạn 5 MB.' : error.message });
    }
});

app.get('/api/v1/store/products', async (req, res) => {
    try {
        await ensureDefaultStoreBooks();
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.status, c.name AS category_name, v.id AS variant_id, v.sku,
                   v.selling_price, v.stock_quantity, image.attribute_value AS image_path
            FROM products p JOIN categories c ON c.id = p.category_id JOIN product_variants v ON p.id = v.product_id
            LEFT JOIN product_attributes image ON image.product_id = p.id AND image.variant_id = v.id AND image.attribute_key = 'image_path'
            WHERE p.status = 'ACTIVE' AND v.status = 'ACTIVE' ORDER BY p.id
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// [CREATE] Thêm sản phẩm mới
app.post('/api/v1/store/products', authenticateToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const name = String(req.body.name || '').trim();
        const price = Number(req.body.price);
        const stock = Number(req.body.stock);
        const sku = String(req.body.sku || `SKU-${Date.now()}`).trim();
        const categoryName = String(req.body.category_name || 'Sách tham khảo').trim();
        const imageName = String(req.body.image_name || '').trim();
        if (name.length < 2 || name.length > 255 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || sku.length > 100) {
            return res.status(400).json({ success: false, error: 'Nhập tên sách, giá bán, tồn kho và SKU hợp lệ.' });
        }
        if (imageName && !isValidStoreCoverName(imageName)) return res.status(400).json({ success: false, error: 'Ảnh bìa không hợp lệ; hãy chọn ảnh có sẵn hoặc tải ảnh JPEG, PNG, WebP.' });
        await conn.beginTransaction();
        const categorySlug = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await conn.query('INSERT INTO categories (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [categoryName, categorySlug]);
        const [[category]] = await conn.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [categorySlug]);
        const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 220) + '-' + crypto.randomBytes(4).toString('hex');
        const [pRes] = await conn.query("INSERT INTO products (category_id, product_type, name, slug, status) VALUES (?, 'BOOK', ?, ?, 'ACTIVE')", [category.id, name, slug]);
        const [variant] = await conn.query("INSERT INTO product_variants (product_id, sku, original_price, selling_price, stock_quantity, reserved_quantity, status) VALUES (?, ?, ?, ?, ?, 0, 'ACTIVE')", [pRes.insertId, sku, price, price, stock]);
        if (imageName) await conn.query("INSERT INTO product_attributes (product_id, variant_id, attribute_key, attribute_value) VALUES (?, ?, 'image_path', ?)", [pRes.insertId, variant.insertId, `products/${imageName}`]);
        await conn.commit();
        res.status(201).json({ success: true, id: pRes.insertId, variant_id: variant.insertId, message: 'Đã thêm sách vào CSDL.' });
    } catch (e) {
        await conn.rollback();
        res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, error: e.code === 'ER_DUP_ENTRY' ? 'SKU này đã tồn tại.' : e.message });
    } finally { conn.release(); }
});

// [UPDATE] Cập nhật thông tin / Tồn kho sản phẩm
app.put('/api/v1/store/products/:id', authenticateToken, async (req, res) => {
    const conn = await pool.getConnection();
    let transactionStarted = false;
    try {
        const id = Number(req.params.id);
        const { name, price, stock, sku, category_name: categoryName, image_name: imageName } = req.body;
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, error: 'Mã sản phẩm không hợp lệ.' });
        if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 255)) return res.status(400).json({ success: false, error: 'Tên sản phẩm cần từ 2 đến 255 ký tự.' });
        if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) return res.status(400).json({ success: false, error: 'Giá bán phải lớn hơn 0.' });
        if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) return res.status(400).json({ success: false, error: 'Tồn kho phải là số nguyên không âm.' });
        if (sku !== undefined && (typeof sku !== 'string' || !sku.trim() || sku.trim().length > 100)) return res.status(400).json({ success: false, error: 'Mã SKU không hợp lệ.' });
        if (categoryName !== undefined && (typeof categoryName !== 'string' || !categoryName.trim() || categoryName.trim().length > 150)) return res.status(400).json({ success: false, error: 'Danh mục không hợp lệ.' });
        if (imageName !== undefined && imageName !== '' && !isValidStoreCoverName(imageName)) return res.status(400).json({ success: false, error: 'Ảnh bìa không hợp lệ; hãy chọn ảnh có sẵn hoặc tải ảnh JPEG, PNG, WebP.' });

        await conn.beginTransaction();
        transactionStarted = true;
        const [rows] = await conn.query(`
            SELECT p.id, p.name, p.category_id, v.id AS variant_id, v.sku, v.reserved_quantity
            FROM products p JOIN product_variants v ON v.product_id = p.id
            WHERE p.id = ? AND p.status = 'ACTIVE' AND v.status = 'ACTIVE'
            ORDER BY v.id LIMIT 1 FOR UPDATE
        `, [id]);
        if (!rows.length) { await conn.rollback(); transactionStarted = false; return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm đang hoạt động.' }); }
        const product = rows[0];
        if (stock !== undefined && Number(stock) < Number(product.reserved_quantity)) {
            await conn.rollback(); transactionStarted = false;
            return res.status(409).json({ success: false, error: `Tồn kho không thể thấp hơn ${product.reserved_quantity} sản phẩm đã được giữ cho đơn hàng.` });
        }

        let categoryId = product.category_id;
        if (categoryName !== undefined) {
            const category = categoryName.trim();
            const categorySlug = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            if (!categorySlug) {
                await conn.rollback(); transactionStarted = false;
                return res.status(400).json({ success: false, error: 'Tên danh mục không hợp lệ.' });
            }
            await conn.query('INSERT INTO categories (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [category, categorySlug]);
            const [[categoryRow]] = await conn.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [categorySlug]);
            categoryId = categoryRow.id;
        }

        if (name !== undefined) {
            const cleanName = name.trim();
            const slugBase = cleanName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 200);
            const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;
            await conn.query('UPDATE products SET name = ?, slug = ?, category_id = ? WHERE id = ?', [cleanName, slug, categoryId, id]);
        } else if (categoryName !== undefined) {
            await conn.query('UPDATE products SET category_id = ? WHERE id = ?', [categoryId, id]);
        }
        await conn.query(`UPDATE product_variants SET sku = COALESCE(?, sku), selling_price = COALESCE(?, selling_price), stock_quantity = COALESCE(?, stock_quantity) WHERE id = ?`, [sku === undefined ? null : sku.trim(), price === undefined ? null : Number(price), stock === undefined ? null : Number(stock), product.variant_id]);
        if (imageName !== undefined) {
            const imagePath = imageName ? `products/${imageName}` : null;
            if (imagePath) {
                const [attributes] = await conn.query("SELECT id FROM product_attributes WHERE product_id = ? AND variant_id = ? AND attribute_key = 'image_path' ORDER BY id LIMIT 1", [id, product.variant_id]);
                if (attributes.length) await conn.query('UPDATE product_attributes SET attribute_value = ? WHERE id = ?', [imagePath, attributes[0].id]);
                else await conn.query("INSERT INTO product_attributes (product_id, variant_id, attribute_key, attribute_value) VALUES (?, ?, 'image_path', ?)", [id, product.variant_id, imagePath]);
            } else {
                await conn.query("DELETE FROM product_attributes WHERE product_id = ? AND variant_id = ? AND attribute_key = 'image_path'", [id, product.variant_id]);
            }
        }
        await conn.commit();
        transactionStarted = false;
        res.json({ success: true, message: 'Cập nhật sản phẩm thành công!' });
    } catch (e) {
        if (transactionStarted) await conn.rollback();
        res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, error: e.code === 'ER_DUP_ENTRY' ? 'Mã SKU này đã được sử dụng.' : e.message });
    } finally { conn.release(); }
});

// [DELETE] Xóa sản phẩm
app.delete('/api/v1/store/products/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa sản phẩm khỏi kho!' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// [CREATE] Checkout đặt hàng
app.get('/api/v1/store/orders', requireStoreAdminSession, async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT o.id, o.order_code, o.status, o.payment_status, o.shipping_status, o.subtotal, o.shipping_fee, o.total_amount,
                   o.guest_name, o.guest_phone, o.guest_email, o.shipping_address_snapshot, o.created_at,
                   (SELECT p.payment_method FROM payments p WHERE p.order_id=o.id ORDER BY p.created_at DESC,p.id DESC LIMIT 1) AS payment_method,
                   (SELECT p.transaction_code FROM payments p WHERE p.order_id=o.id ORDER BY p.created_at DESC,p.id DESC LIMIT 1) AS transaction_code
            FROM orders o ORDER BY o.created_at DESC, o.id DESC
        `);
        const ids = orders.map(order => order.id);
        const items = ids.length ? (await pool.query('SELECT order_id, product_name_snapshot, sku_snapshot, price_snapshot, quantity FROM order_items WHERE order_id IN (?) ORDER BY order_id, id', [ids]))[0] : [];
        const itemsByOrder = new Map();
        for (const item of items) {
            if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
            itemsByOrder.get(item.order_id).push(item);
        }
        res.json({ success: true, data: orders.map(order => ({
            ...order,
            shipping_address_snapshot: typeof order.shipping_address_snapshot === 'string' ? JSON.parse(order.shipping_address_snapshot) : order.shipping_address_snapshot,
            items: itemsByOrder.get(order.id) || []
        })) });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/v1/store/orders/:id', requireStoreAdminSession, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const orderId = Number(req.params.id);
        const { status, payment_status, shipping_status, transaction_code, payment_note } = req.body;
        const validOrderStatuses = new Set(['PENDING_PAYMENT', 'PENDING_CONFIRM', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED']);
        const validPaymentStatuses = new Set(['UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED']);
        const validShippingStatuses = new Set(['UNSHIPPED', 'SHIPPED', 'DELIVERED', 'FAILED']);
        if (!Number.isInteger(orderId) || orderId < 1 || !validOrderStatuses.has(status) || !validPaymentStatuses.has(payment_status) || !validShippingStatuses.has(shipping_status)) {
            return res.status(400).json({ success: false, error: 'Trạng thái đơn hàng, giao hàng hoặc thanh toán không hợp lệ.' });
        }
        await conn.beginTransaction();
        const [[current]] = await conn.query('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        if (!current) { await conn.rollback(); return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng.' }); }
        await conn.query('UPDATE orders SET status = ?, payment_status = ?, shipping_status = ? WHERE id = ?', [status, payment_status, shipping_status, orderId]);
        if (current.status !== status) await conn.query('INSERT INTO order_status_history (order_id, previous_status, new_status, note) VALUES (?, ?, ?, ?)', [orderId, current.status, status, String(req.body.status_note || '').trim() || null]);
        const [[latestPayment]] = await conn.query('SELECT id FROM payments WHERE order_id = ? ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE', [orderId]);
        if (latestPayment) {
            const paymentRowStatus = payment_status === 'PAID' ? 'SUCCESS' : payment_status === 'UNPAID' ? 'PENDING' : null;
            await conn.query('UPDATE payments SET status = COALESCE(?, status), transaction_code = COALESCE(?, transaction_code), note = COALESCE(?, note) WHERE id = ?', [paymentRowStatus, String(transaction_code || '').trim() || null, String(payment_note || '').trim() || null, latestPayment.id]);
        }
        await conn.commit();
        res.json({ success: true, message: 'Đã cập nhật đơn hàng và trạng thái thanh toán.' });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ success: false, error: e.message });
    } finally { conn.release(); }
});

app.post('/api/v1/store/checkout', authenticateToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const customer = req.body.customer_info || {};
        const shippingAddress = {
            recipient_name: String(customer.full_name || '').trim(),
            phone: String(customer.phone || '').trim(),
            email: String(customer.email || '').trim() || null,
            address_line: String(customer.address_line || customer.address_detail || '').trim(),
            ward: String(customer.ward || '').trim(),
            district: String(customer.district || '').trim(),
            province: String(customer.province || '').trim(),
            postal_code: String(customer.postal_code || '').trim() || null
        };
        if (!items.length || !shippingAddress.recipient_name || !shippingAddress.phone || !shippingAddress.address_line || !shippingAddress.ward || !shippingAddress.province) {
            return res.status(400).json({ success: false, error: 'Vui lòng nhập đủ người nhận, số điện thoại và địa chỉ giao hàng.' });
        }
        await conn.beginTransaction();
        let total = 0;
        const orderLines = [];
        for (const item of items) {
            const variantId = Number(item.variant_id);
            const quantity = Number(item.quantity);
            if (!Number.isInteger(variantId) || variantId < 1 || !Number.isInteger(quantity) || quantity < 1) throw new Error('Sản phẩm trong giỏ hàng không hợp lệ.');
            const [[variant]] = await conn.query(`SELECT v.id, v.sku, v.selling_price, v.stock_quantity, v.reserved_quantity, p.name FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ? AND v.status = 'ACTIVE' FOR UPDATE`, [variantId]);
            if (!variant) throw new Error('Có sản phẩm không còn khả dụng. Vui lòng tải lại giỏ hàng.');
            if (variant.stock_quantity - variant.reserved_quantity < quantity) throw new Error(`Sách "${variant.name}" không đủ số lượng trong kho.`);
            const unitPrice = Number(variant.selling_price);
            total += unitPrice * quantity;
            orderLines.push({ ...variant, quantity, unitPrice });
        }
        const orderCode = 'ORD' + Date.now();
        const [orderResult] = await conn.query(
            `INSERT INTO orders (order_code, status, payment_status, subtotal, total_amount, guest_name, guest_phone, guest_email, shipping_address_snapshot) VALUES (?, 'PENDING_CONFIRM', 'UNPAID', ?, ?, ?, ?, ?, ?)`,
            [orderCode, total, total, shippingAddress.recipient_name, shippingAddress.phone, shippingAddress.email, JSON.stringify(shippingAddress)]
        );
        const requestedMethod = String(req.body.payment_method || 'COD');
        const paymentMethod = requestedMethod === 'MOMO' ? 'ONLINE_GATEWAY' : requestedMethod;
        if (!['COD', 'BANK_TRANSFER', 'ONLINE_GATEWAY'].includes(paymentMethod)) throw new Error('Phương thức thanh toán không hợp lệ.');
        await conn.query("INSERT INTO payments (order_id, payment_method, amount, status, note) VALUES (?, ?, ?, 'PENDING', ?)", [orderResult.insertId, paymentMethod, total, requestedMethod === 'MOMO' ? 'Khách chọn ví MoMo; chờ xác nhận giao dịch.' : null]);
        for (const line of orderLines) {
            await conn.query('INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku_snapshot, price_snapshot, quantity) VALUES (?, ?, ?, ?, ?, ?)', [orderResult.insertId, line.id, line.name, line.sku, line.unitPrice, line.quantity]);
            await conn.query('UPDATE product_variants SET reserved_quantity = reserved_quantity + ? WHERE id = ?', [line.quantity, line.id]);
        }
        await conn.commit();
        res.status(201).json({ success: true, message: 'Đặt hàng thành công!', order_code: orderCode });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ success: false, error: e.message });
    } finally { conn.release(); }
});
// Keep API failures in JSON format so admin pages never receive an HTML 404/error page.
app.use('/api', (err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, error: err.message || 'API request failed.' });
});
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));
