const db = require('../config/dbConfig');

// Hàm tính số tuần (ISO 8601 week number)
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

// 1. Ghi nhận báo cáo (Create/Update theo tuần)
const createBulkReports = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { reports, reporter_id, week_number, year } = req.body;
    
    // Kiểm tra quyền hạn: 
    // Nếu không phải là admin (teacher), kiểm tra xem có đang sửa tuần quá khứ không
    const userQuery = 'SELECT role_id FROM users WHERE id = ?';
    const [users] = await connection.query(userQuery, [reporter_id]);
    const userRole = users[0]?.role_id; // 1 là admin/GVCN

    const currentWeek = getWeekNumber(new Date());
    
    // Nếu không phải GVCN (role_id = 1) và tuần gửi lên khác tuần hiện tại -> Chặn
    if (userRole !== 1 && parseInt(week_number) !== currentWeek) {
        return res.status(403).json({ message: 'Bạn chỉ có thể chỉnh sửa sổ của tuần hiện tại!' });
    }

    await connection.beginTransaction();

    // Xóa dữ liệu cũ của tuần đó (để ghi đè bản mới nhất)
    // Lưu ý: Chỉ xóa các record của học sinh trong danh sách gửi lên
    if (reports.length > 0) {
        const studentIds = reports.map(r => r.student_id);
        if (studentIds.length > 0) {
            const deleteQuery = `
                DELETE FROM daily_logs 
                WHERE week_number = ? AND student_id IN (?)
            `;
            await connection.query(deleteQuery, [week_number, studentIds]);
        }
    }

    // Insert dữ liệu mới
    const insertQuery = `
      INSERT INTO daily_logs (student_id, reporter_id, violation_type_id, log_date, week_number, quantity)
      VALUES ?
    `;

    // Chọn ngày lưu là ngày hiện tại
    const logDate = new Date().toISOString().split('T')[0];

    const values = reports.map(report => [
      report.student_id,
      reporter_id,
      report.violation_type_id,
      logDate,
      week_number,
      report.quantity || 1
    ]);

    if (values.length > 0) {
      await connection.query(insertQuery, [values]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Lưu sổ thành công' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error });
  } finally {
    connection.release();
  }
};

// 2. Lấy dữ liệu báo cáo của một tuần cụ thể (để hiển thị lên bảng)
const getWeeklyReport = async (req, res) => {
    try {
        const { week, group_number } = req.query;
        
        let query = `
            SELECT student_id, violation_type_id, quantity
            FROM daily_logs l
            JOIN users u ON l.student_id = u.id
            WHERE l.week_number = ?
        `;
        
        const params = [week];

        if (group_number) {
            query += ` AND u.group_number = ?`;
            params.push(group_number);
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu tuần' });
    }
};

// 3. Lấy dữ liệu theo ngày (API cũ, giữ lại để tương thích nếu cần)
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

// 4. Lấy lịch sử cá nhân học sinh
const getMyLogs = async (req, res) => {
  try {
    const studentId = req.user.id; 
    
    const query = `
      SELECT 
        dl.id,
        dl.log_date,
        dl.week_number,
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
  getWeeklyReport,
  getViolationsByDate,
  getMyLogs
};