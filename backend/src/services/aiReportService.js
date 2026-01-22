const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const generateClassReport = async (reportData, startDate, endDate) => {
    try {
        
        const summary = reportData.map(item => ({
            student: item.student_name,
            group: item.group_number,
            violation: item.violation_name,
            points: item.points * item.quantity, 
            quantity: item.quantity
        }));

        const prompt = `
        Bạn là một giáo viên chủ nhiệm tâm lý nhưng nghiêm khắc. Dựa vào dữ liệu vi phạm nề nếp của lớp từ ngày ${startDate} đến ${endDate} dưới đây, hãy viết một đoạn nhận xét ngắn gọn (khoảng 100-150 từ) về tình hình lớp học.
        
        Dữ liệu (định dạng JSON):
        ${JSON.stringify(summary)}

        Yêu cầu nhận xét:
        1. Nhận xét tổng quan về nề nếp trong tuần.
        2. Chỉ ra các lỗi vi phạm phổ biến nhất mà lớp cần khắc phục.
        3. Nhắc nhở chung các tổ hoặc cá nhân có nhiều điểm trừ (nếu nghiêm trọng).
        4. Giọng văn: Mang tính xây dựng, khuyến khích học sinh tiến bộ, tập trung hoàn toàn vào bối cảnh lớp học/trường học.
        5. Sử dụng Tiếng Việt.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: 'openai/gpt-oss-120b', 
            temperature: 0.7,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "Không thể tạo nhận xét lúc này.";
    } catch (error) {
        console.error("Error in aiReportService:", error);
        throw new Error("Lỗi khi gọi Groq AI");
    }
};

module.exports = {
    generateClassReport
};