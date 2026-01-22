const Groq = require('groq-sdk');
require('dotenv').config();

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('⚠️ CẢNH BÁO: Chưa cấu hình GROQ_API_KEY trên server.');
        return null;
    }
    return new Groq({ apiKey });
};

const generateClassReport = async (reportData, startDate, endDate) => {
    const groq = getGroqClient();

    if (!groq) {
        return 'Chức năng AI đang tạm khóa do chưa cấu hình API Key. Vui lòng kiểm tra cài đặt Environment trên Render.';
    }

    try {
        const summary = reportData.map((item) => ({
            hoc_sinh: item.student_name,
            to: item.group_number,
            noi_dung: item.violation_name,
            loai_diem: item.points > 0 ? 'TÍCH CỰC (Cộng điểm)' : 'VI PHẠM (Trừ điểm)',
            tong_diem: item.points * item.quantity,
            so_luong: item.quantity,
        }));

        const prompt = `
        Bạn là một giáo viên chủ nhiệm tâm lý, mẫu mực. Dựa vào dữ liệu hoạt động của lớp từ ngày ${startDate} đến ${endDate} dưới đây:
        
        Dữ liệu (JSON):
        ${JSON.stringify(summary)}

        Hãy viết một bản nhận xét tổng kết tuần học. 
        
        Quy tắc xử lý dữ liệu:
        1. Những mục có "tong_diem" > 0 là hành động tốt, cần được TUYÊN DƯƠNG.
        2. Những mục có "tong_diem" < 0 là các lỗi vi phạm, cần được NHẮC NHỞ/PHÊ BÌNH nhẹ nhàng để khắc phục.

        Yêu cầu về định dạng và văn phong (QUAN TRỌNG):
        - Tuyệt đối KHÔNG sử dụng các ký tự định dạng Markdown như dấu sao đôi (**), dấu thăng (#), dấu gạch đầu dòng (-).
        - Trình bày thành các đoạn văn xuôi, ngắt dòng hợp lý.
        - Văn phong: Trang trọng, sư phạm nhưng gần gũi, mang tính xây dựng.
        - Một đoạn văn khoảng 2-4 câu, không quá dài dòng.
        - Sử dụng ngôn ngữ tích cực, khích lệ.
        - Gọi các học sinh bằng "em" để tạo sự thân thiện.
        - Tránh xưng hô quá mức như "quý phụ huynh", "các em học sinh thân"
        - Tránh tự gọi chính mình như "giáo viên chủ nhiệm", "tôi", "chúng tôi", "thầy".

        Cấu trúc bài nhận xét:
        1. Đánh giá chung về nề nếp và tinh thần học tập của lớp trong tuần.
        2. Tuyên dương các cá nhân hoặc tổ có thành tích tốt (điểm cộng).
        3. Nhắc nhở chung về các lỗi vi phạm thường gặp (điểm trừ) cần khắc phục.
        4. Lời động viên và phương hướng cho tuần tiếp theo.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 0.6,
            max_tokens: 1500,
        });

        return chatCompletion.choices[0]?.message?.content || 'Không có phản hồi từ AI.';
    } catch (error) {
        console.error('Lỗi AI Service:', error);
        return 'Hệ thống đang bận, vui lòng thử lại sau.';
    }
};

module.exports = {
    generateClassReport,
};
