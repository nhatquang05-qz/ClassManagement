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
    
    // Kiểm tra quyền hạn
    const userQuery = 'SELECT role_id FROM users WHERE id = ?';
    const [users] = await connection.query(userQuery, [reporter_id]);
    const userRole = users[0]?.role_id; // 1 là admin/GVCN

    const currentWeek = getWeekNumber(new Date());
    
    // Nếu không phải admin (role 1) thì chỉ được sửa tuần hiện tại
    if (userRole !== 1 && parseInt(week_number) !== currentWeek) {
        return res.status(403).json({ message: 'Bạn chỉ có thể chỉnh sửa sổ của tuần hiện tại!' });
    }

    await connection.beginTransaction();

    // Xóa dữ liệu cũ của tuần đó để ghi đè (chỉ xóa của những học sinh được gửi lên)
    if (reports.length > 0) {
        const studentIds = [...new Set(reports.map(r => r.student_id))]; // Lấy danh sách unique student_id
        if (studentIds.length > 0) {
            const deleteQuery = `
                DELETE FROM daily_logs 
                WHERE week_number = ? AND student_id IN (?)
            `;
            // Đã sửa lỗi chính tả: WHEREyb -> WHERE
            await connection.query(deleteQuery, [week_number, studentIds]);
        }
    } 

    // Insert dữ liệu mới
    if (reports.length > 0) {
      const insertQuery = `
        INSERT INTO daily_logs (student_id, reporter_id, violation_type_id, log_date, week_number, quantity, note)
        VALUES ?
      `;

      const values = reports.map(report => [
        report.student_id,
        reporter_id,
        report.violation_type_id,
        report.log_date, // Sử dụng ngày từ frontend gửi lên
        week_number,
        report.quantity || 1,
        report.note || null
      ]);

      await connection.query(insertQuery, [values]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Lưu sổ thành công' });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi lưu sổ:", error);
    res.status(500).json({ message: 'Lỗi server', error });
  } finally {
    connection.release();
  }
};

// 2. Lấy dữ liệu báo cáo của một tuần cụ thể
const getWeeklyReport = async (req, res) => {
    try {
        const { week, group_number } = req.query;
        
        // Query join để lấy đầy đủ thông tin chi tiết (cho cả hiển thị bảng và lịch sử)
        let query = `
            SELECT 
                dl.id,
                dl.student_id, 
                dl.violation_type_id, 
                dl.quantity, 
                dl.log_date, 
                dl.note,
                dl.created_at, 
                u.full_name as student_name,
                vt.name as violation_name,
                vt.points
            FROM daily_logs dl
            JOIN users u ON dl.student_id = u.id
            JOIN violation_types vt ON dl.violation_type_id = vt.id
            WHERE dl.week_number = ?
        `;
        
        const params = [week];

        if (group_number) {
            query += ` AND u.group_number = ?`;
            params.push(group_number);
        }

        // Sắp xếp: Ngày vi phạm giảm dần, sau đó đến thời gian tạo giảm dần (mới nhất lên đầu)
        query += ` ORDER BY dl.log_date DESC, dl.created_at DESC`;

        const [rows] = await db.query(query, params);
        
        // Format date thành YYYY-MM-DD string
        const formattedRows = rows.map(row => ({
            ...row,
            log_date: row.log_date instanceof Date ? row.log_date.toISOString().split('T')[0] : row.log_date
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu tuần' });
    }
};

// 3. Lấy dữ liệu theo ngày (API cũ, giữ nguyên nếu còn dùng)
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
        dl.note,
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

const deleteReport = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const reporter_id = req.user.id;
        
        // Kiểm tra quyền: Chỉ người tạo ra log đó hoặc Admin mới được xóa
        // (Logic đơn giản hóa, có thể check thêm week_number nếu cần chặt chẽ)
        const [log] = await connection.query('SELECT reporter_id FROM daily_logs WHERE id = ?', [id]);
        
        if (log.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        }

        // Lấy role của user đang request
        const [user] = await connection.query('SELECT role_id FROM users WHERE id = ?', [reporter_id]);
        const isAdmin = user[0]?.role_id === 1;

        if (!isAdmin && log[0].reporter_id !== reporter_id) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa dòng này' });
        }

        await connection.query('DELETE FROM daily_logs WHERE id = ?', [id]);
        
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa', error });
    } finally {
        connection.release();
    }
};

module.exports = {
  createBulkReports,
  getWeeklyReport,
  getViolationsByDate,
  getMyLogs,
  deleteReport
};