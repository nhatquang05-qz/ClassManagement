const db = require('../config/dbConfig');

const getGroupRankings = async (req, res) => {
    try {
        const { class_id } = req.query;

        let query = `
      SELECT 
        u.group_number,
        COALESCE(SUM(vt.points * dl.quantity), 0) as total_points
      FROM users u
      LEFT JOIN daily_logs dl ON u.id = dl.student_id
      LEFT JOIN violation_types vt ON dl.violation_type_id = vt.id
      WHERE u.group_number IS NOT NULL
    `;

        const params = [];
        if (class_id) {
            query += ` AND u.class_id = ?`;
            params.push(class_id);
        }

        query += `
      GROUP BY u.group_number
      ORDER BY total_points DESC
    `;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy bảng xếp hạng' });
    }
};

module.exports = { getGroupRankings };
