const aiReportService = require('../services/aiReportService');

const getAIReview = async (req, res) => {
    try {
        const { reportData, startDate, endDate } = req.body;

        if (!reportData || reportData.length === 0) {
            return res.status(400).json({ message: 'Không có dữ liệu báo cáo để nhận xét.' });
        }

        const review = await aiReportService.generateClassReport(reportData, startDate, endDate);

        res.status(200).json({ review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi tạo nhận xét AI.' });
    }
};

module.exports = {
    getAIReview,
};
