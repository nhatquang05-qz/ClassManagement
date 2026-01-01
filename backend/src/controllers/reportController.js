const db = require('../config/dbConfig');

const createBulkReports = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { reports, reporter_id, log_date } = req.body;
    
    await connection.beginTransaction();

    const query = `
      INSERT INTO daily_logs (student_id, reporter_id, violation_type_id, log_date, quantity)
      VALUES ?
    `;

    const values = reports.map(report => [
      report.student_id,
      reporter_id,
      report.violation_type_id,
      log_date,
      report.quantity || 1
    ]);

    if (values.length > 0) {
      await connection.query(query, [values]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Ghi nhận thành công' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Lỗi server', error });
  } finally {
    connection.release();
  }
};

const getViolationsByDate = async (req, res) => {
  try {
    const { date, group_number } = req.query;
    let query = `
      SELECT l.*, u.full_name as student_name, v.name as violation_name, v.points
      FROM daily_logs l
      JOIN users u ON l.student_id = u.id
      JOIN violation_types v ON l.violation_type_id = v.id
      WHERE l.log_date = ?
    `;
    
    const params = [date];

    if (group_number) {
      query += ` AND u.group_number = ?`;
      params.push(group_number);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy dữ liệu', error });
  }
};

const getMyLogs = async (req, res) => {
  try {
    const studentId = req.user.id; // Lấy ID từ token (middleware xác thực)
    
    const query = `
      SELECT 
        dl.id,
        dl.log_date,
        dl.quantity,
        vt.name as violation_name,
        vt.category,
        vt.points,
        u.full_name as reporter_name
      FROM daily_logs dl
      JOIN violation_types vt ON dl.violation_type_id = vt.id
      JOIN users u ON dl.reporter_id = u.id
      WHERE dl.student_id = ?
      ORDER BY dl.log_date DESC, dl.created_at DESC
    `;

    const [rows] = await db.query(query, [studentId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy lịch sử cá nhân' });
  }
};

module.exports = {
  createBulkReports,
  getViolationsByDate,
  getMyLogs
};