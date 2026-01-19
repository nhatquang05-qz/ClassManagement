const db = require('../config/dbConfig');

const createSupportRequest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { content } = req.body;
        const user_id = req.user ? req.user.id : null;

        if (!content) {
            return res.status(400).json({ message: 'Vui lòng nhập nội dung sự cố' });
        }

        await connection.query(`INSERT INTO support_requests (user_id, content) VALUES (?, ?)`, [
            user_id,
            content,
        ]);

        res.status(201).json({ message: 'Đã gửi báo cáo thành công!' });
    } catch (error) {
        console.error('Lỗi gửi hỗ trợ:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau.' });
    } finally {
        connection.release();
    }
};

const getAllRequests = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT sr.*, u.full_name, u.group_number 
            FROM support_requests sr
            LEFT JOIN users u ON sr.user_id = u.id
            ORDER BY sr.created_at DESC
        `);
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách hỗ trợ' });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM support_requests WHERE id = ?', [id]);
        res.json({ message: 'Đã xóa yêu cầu' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa yêu cầu' });
    }
};

module.exports = { createSupportRequest, getAllRequests, deleteRequest };
