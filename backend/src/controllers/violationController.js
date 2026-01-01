const db = require('../config/dbConfig');

const getAllViolations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM violation_types ORDER BY category, points');
    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy violation:", error);
    res.status(500).json({ message: 'Lỗi lấy danh sách vi phạm' });
  }
};

module.exports = { getAllViolations };