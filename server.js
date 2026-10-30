require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo SDK OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Cấu hình API Key trong file .env
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CSDL mô phỏng (Có thể kết nối MySQL/MongoDB thực tế tại đây)
const database = {
    works: [],
    journals: []
};

// ==========================================
// 1. API: AI BOOK COACH (Gợi ý dàn ý từ ChatGPT)
// ==========================================
app.post('/api/v1/school/ai-book-coach/generate-outline', async (req, res) => {
    try {
        const { title, target_audience, genre, body } = req.body;

        // Nếu truyền vào 'body', gọi AI kiểm tra văn bản
        if (body) {
            const editorPrompt = `Bạn là Trợ lý biên tập văn bản cho học sinh. Hãy kiểm tra đoạn văn sau:
"${body}"

Trả về định dạng JSON thuần hợp lệ (không kèm Markdown codeblock) với cấu trúc:
{
  "rating": "Khá Tốt / Cần Cải Thiện / Xuất Sắc",
  "spelling_errors": "Chi tiết lỗi chính tả tìm thấy hoặc KHÔNG NẾU KHÔNG CÓ",
  "feedback": "Lời nhận xét động viên dành cho học sinh"
}`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: editorPrompt }],
                temperature: 0.3,
            });

            const parsedData = JSON.parse(completion.choices[0].message.content);
            return res.json({ success: true, data: parsedData });
        }

        // Ngược lại: Gợi ý dàn ý sách
        const systemPrompt = `Bạn là Trợ Lý AI Đồng Hành Sáng Tạo Sách cho học sinh.
Nhiệm vụ: Gợi ý dàn ý và cấu trúc cuốn sách, gợi mở tư duy chứ KHÔNG viết thay học sinh.
Định dạng trả về: Chuỗi JSON thuần (JSON valid) có dạng:
{
  "suggested_title": "Tên sách được trau chuốt hơn",
  "chapters": [
    "Chương 1: Tên chương...",
    "Chương 2: Tên chương...",
    "Chương 3: Tên chương..."
  ]
}`;

        const userPrompt = `Tên cuốn sách mong muốn: ${title}
Đối tượng đọc: ${target_audience}
Chủ đề: ${genre}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        });

        const aiContent = JSON.parse(completion.choices[0].message.content);

        return res.json({
            success: true,
            data: aiContent
        });

    } catch (error) {
        console.error('Lỗi OpenAI API:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi gọi mô hình AI: ' + error.message });
    }
});

// ==========================================
// 2. API: LƯU TÁC PHẨM & NHẬT KÝ VÀO CSDL
// ==========================================
app.post('/api/v1/school/works', (req, res) => {
    try {
        const { title, content_type, body, age_group, category } = req.body;

        const record = {
            id: Date.now(),
            title,
            content_type,
            body,
            age_group,
            category,
            created_at: new Date()
        };

        database.works.push(record);

        res.json({
            success: true,
            message: 'Đã lưu vào CSDL thành công!',
            data: record
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể lưu vào CSDL.' });
    }
});

// Chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});