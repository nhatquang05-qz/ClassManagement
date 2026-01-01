const db = require('../config/dbConfig');

const getUsers = async (req, res) => {
  try {
    const { group_number } = req.query;

    let query = `
      SELECT id, full_name, group_number, role_id 
      FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'student')
    `;
    const params = [];

    if (group_number) {
      query += ` AND group_number = ?`;
      params.push(group_number);
    }

    query += ` ORDER BY group_number ASC, full_name ASC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy user:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách học sinh' });
  }
};

module.exports = { getUsers };
