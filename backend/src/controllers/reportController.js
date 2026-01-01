const db = require('../config/dbConfig');

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const createBulkReports = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { reports, reporter_id, week_number, log_date } = req.body;

    if (!log_date) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày ghi nhận' });
    }

    const [users] = await connection.query('SELECT full_name FROM users WHERE id = ?', [
      reporter_id,
    ]);

    await connection.beginTransaction();

    let affectedStudentIds = [];
    if (reports.length > 0) {
      affectedStudentIds = [...new Set(reports.map((r) => r.student_id))];
    }

    const logDesc = `Cập nhật sổ ngày ${log_date}. Số HS có ghi nhận: ${affectedStudentIds.length}`;

    await connection.query(
      'INSERT INTO audit_logs (user_id, action, target_date, description) VALUES (?, ?, ?, ?)',
      [reporter_id, 'UPDATE_DAILY', log_date, logDesc]
    );

    if (affectedStudentIds.length > 0) {
      await connection.query('DELETE FROM daily_logs WHERE log_date = ? AND student_id IN (?)', [
        log_date,
        affectedStudentIds,
      ]);
    }

    if (reports.length > 0) {
      const insertQuery = `
        INSERT INTO daily_logs (student_id, reporter_id, violation_type_id, log_date, week_number, quantity, note)
        VALUES ?
      `;

      const values = reports.map((report) => [
        report.student_id,
        reporter_id,
        report.violation_type_id,
        log_date,
        week_number,
        report.quantity || 1,
        report.note || null,
      ]);

      await connection.query(insertQuery, [values]);
    }

    await connection.commit();
    res.status(201).json({ message: `Đã lưu thành công dữ liệu ngày ${log_date}` });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi lưu sổ:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  } finally {
    connection.release();
  }
};

const getWeeklyReport = async (req, res) => {
  try {
    const { week, group_number } = req.query;

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
                vt.category,
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

const deleteReport = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const reporter_id = req.user.id;

    const [oldLog] = await connection.query(
      `
            SELECT dl.*, u.full_name, vt.name as violation_name 
            FROM daily_logs dl
            JOIN users u ON dl.student_id = u.id
            JOIN violation_types vt ON dl.violation_type_id = vt.id
            WHERE dl.id = ?
        `,
      [id]
    );

    if (oldLog.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
    }

    const [user] = await connection.query('SELECT role_id FROM users WHERE id = ?', [reporter_id]);
    const isAdmin = user[0]?.role_id === 1;
    if (!isAdmin && oldLog[0].reporter_id !== reporter_id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa dòng này' });
    }

    const targetDate = formatDate(oldLog[0].log_date);
    const logDesc = `Xóa vi phạm: ${oldLog[0].violation_name} của HS ${oldLog[0].full_name} (Ngày ${targetDate})`;

    await connection.query(
      'INSERT INTO audit_logs (user_id, action, target_date, description) VALUES (?, ?, ?, ?)',
      [reporter_id, 'DELETE', targetDate, logDesc]
    );

    await connection.query('DELETE FROM daily_logs WHERE id = ?', [id]);

    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi xóa', error });
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

const getDetailedReport = async (req, res) => {
  try {
    const { startDate, endDate, studentName, violationTypeId, groupId } = req.query;

    let query = `
      SELECT 
        dl.id,
        dl.student_id,
        DATE_FORMAT(dl.log_date, '%Y-%m-%d') as log_date,
        dl.week_number,
        dl.quantity,
        dl.note,
        u.full_name as student_name,
        u.group_number,
        vt.name as violation_name,
        vt.category,
        vt.points
      FROM daily_logs dl
      JOIN users u ON dl.student_id = u.id
      JOIN violation_types vt ON dl.violation_type_id = vt.id
      WHERE 1=1
    `;

    const params = [];

    if (startDate && endDate) {
      query += ` AND dl.log_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (studentName) {
      query += ` AND u.full_name LIKE ?`;
      params.push(`%${studentName}%`);
    }

    if (violationTypeId) {
      query += ` AND dl.violation_type_id = ?`;
      params.push(violationTypeId);
    }

    if (groupId) {
      query += ` AND u.group_number = ?`;
      params.push(groupId);
    }

    query += ` ORDER BY dl.log_date DESC, u.group_number ASC, u.full_name ASC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy báo cáo chi tiết:', error);
    res.status(500).json({ message: 'Lỗi lấy báo cáo chi tiết', error });
  }
};

module.exports = {
  createBulkReports,
  getWeeklyReport,
  getViolationsByDate,
  getMyLogs,
  deleteReport,
  getDetailedReport,
};
