const db = require('../config/dbConfig');

// Helper: Format date YYYY-MM-DD để ghi log text cho đẹp
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// 1. Ghi nhận báo cáo (Lưu theo ngày cụ thể & Ghi Audit Log)
const createBulkReports = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // log_date là bắt buộc để biết đang lưu ngày nào (YYYY-MM-DD)
    const { reports, reporter_id, week_number, log_date } = req.body; 

    if (!log_date) {
        return res.status(400).json({ message: 'Thiếu thông tin ngày ghi nhận' });
    }

    // Lấy thông tin người sửa để ghi log
    const [users] = await connection.query('SELECT full_name, role_id FROM users WHERE id = ?', [reporter_id]);
    const reporterName = users[0]?.full_name || 'Unknown';
    
    // Bắt đầu transaction
    await connection.beginTransaction();

    // 1. Xác định danh sách học sinh bị tác động trong lần lưu này
    let affectedStudentIds = [];
    if (reports.length > 0) {
        affectedStudentIds = [...new Set(reports.map(r => r.student_id))];
    }

    // 2. GHI AUDIT LOG (Trước khi thực hiện thay đổi)
    // Ghi nhận: Ai làm gì, ngày nào
    const logDesc = `Cập nhật sổ ngày ${log_date}. Số HS có ghi nhận: ${affectedStudentIds.length}`;
    
    await connection.query(
        'INSERT INTO audit_logs (user_id, action, target_date, description) VALUES (?, ?, ?, ?)',
        [reporter_id, 'UPDATE_DAILY', log_date, logDesc]
    );

    // 3. XÓA DỮ LIỆU CŨ (QUAN TRỌNG: CHỈ XÓA CỦA NGÀY log_date)
    // Fix lỗi: Trước đây xóa theo week_number nên mất dữ liệu các ngày khác
    // Chúng ta xóa dữ liệu cũ của các học sinh có trong danh sách gửi lên (để update lại trạng thái mới)
    // Nếu danh sách gửi lên rỗng (tức là xóa hết lỗi của ngày đó cho 1 HS), frontend cần gửi logic phù hợp. 
    // Tuy nhiên, để an toàn, đoạn code này giả định reports chứa snapshot các lỗi hiện tại của ngày đó.
    
    if (affectedStudentIds.length > 0) {
         const deleteQuery = `
            DELETE FROM daily_logs 
            WHERE log_date = ? AND student_id IN (?)
         `;
         await connection.query(deleteQuery, [log_date, affectedStudentIds]);
    }

    // 4. INSERT DỮ LIỆU MỚI
    if (reports.length > 0) {
      const insertQuery = `
        INSERT INTO daily_logs (student_id, reporter_id, violation_type_id, log_date, week_number, quantity, note)
        VALUES ?
      `;

      const values = reports.map(report => [
        report.student_id,
        reporter_id,
        report.violation_type_id,
        log_date, // Sử dụng chính xác ngày gửi lên
        week_number,
        report.quantity || 1,
        report.note || null
      ]);

      await connection.query(insertQuery, [values]);
    }

    await connection.commit();
    res.status(201).json({ message: `Đã lưu thành công dữ liệu ngày ${log_date}` });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi lưu sổ:", error);
    res.status(500).json({ message: 'Lỗi server', error });
  } finally {
    connection.release();
  }
};

// 2. Lấy dữ liệu báo cáo tuần (ĐÃ FIX LỖI TIMEZONE)
const getWeeklyReport = async (req, res) => {
    try {
        const { week, group_number } = req.query;
        
        // QUAN TRỌNG: DATE_FORMAT(dl.log_date, '%Y-%m-%d')
        // Hàm này ép MySQL trả về chuỗi String "2024-01-10" thay vì Date Object
        // Giúp Frontend so sánh chuỗi chính xác 100%, không bị lệch múi giờ.
        let query = `
            SELECT 
                dl.id,
                dl.student_id, 
                dl.violation_type_id, 
                dl.quantity, 
                DATE_FORMAT(dl.log_date, '%Y-%m-%d') as log_date, 
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

        query += ` ORDER BY dl.log_date DESC, dl.created_at DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu tuần' });
    }
};

// 3. Xóa một bản ghi báo cáo (Kèm Audit Log)
const deleteReport = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const reporter_id = req.user.id;
        
        // Lấy thông tin bản ghi cũ trước khi xóa để ghi log
        const [oldLog] = await connection.query(`
            SELECT dl.*, u.full_name, vt.name as violation_name 
            FROM daily_logs dl
            JOIN users u ON dl.student_id = u.id
            JOIN violation_types vt ON dl.violation_type_id = vt.id
            WHERE dl.id = ?
        `, [id]);
        
        if (oldLog.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        }
        
        // Check quyền (chỉ admin hoặc người tạo mới được xóa)
        const [user] = await connection.query('SELECT role_id FROM users WHERE id = ?', [reporter_id]);
        const isAdmin = user[0]?.role_id === 1;
        if (!isAdmin && oldLog[0].reporter_id !== reporter_id) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa dòng này' });
        }

        const targetDate = formatDate(oldLog[0].log_date); // Format ngày từ DB
        const logDesc = `Xóa vi phạm: ${oldLog[0].violation_name} của HS ${oldLog[0].full_name} (Ngày ${targetDate})`;

        // Ghi Audit Log
        await connection.query(
            'INSERT INTO audit_logs (user_id, action, target_date, description) VALUES (?, ?, ?, ?)',
            [reporter_id, 'DELETE', targetDate, logDesc]
        );

        // Thực hiện xóa
        await connection.query('DELETE FROM daily_logs WHERE id = ?', [id]);
        
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa', error });
    } finally {
        connection.release();
    }
};

// 4. Lấy dữ liệu theo ngày (API cũ - Giữ nguyên nếu còn dùng cho Dashboard)
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

// 5. Lấy lịch sử cá nhân (Đã fix Timezone)
const getMyLogs = async (req, res) => {
  try {
    const studentId = req.user.id; 
    const query = `
      SELECT 
        dl.id,
        DATE_FORMAT(dl.log_date, '%Y-%m-%d') as log_date,
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

module.exports = {
  createBulkReports,
  getWeeklyReport,
  getViolationsByDate,
  getMyLogs,
  deleteReport
};