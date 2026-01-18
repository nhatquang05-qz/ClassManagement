const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');

const generateDefaultSchedule = (startDateStr, weeks = 40) => {
    if (!startDateStr) return null;

    const schedule = [];
    const start = new Date(startDateStr);

    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));

    for (let i = 0; i < weeks; i++) {
        const currentWeekDate = new Date(monday);
        currentWeekDate.setDate(monday.getDate() + i * 7);

        const y = currentWeekDate.getFullYear();
        const m = String(currentWeekDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentWeekDate.getDate()).padStart(2, '0');

        schedule.push({
            week: i + 1,
            startDate: `${y}-${m}-${d}`,
            isBreak: false,
            title: `Tuần ${i + 1}`,
        });
    }
    return JSON.stringify(schedule);
};

const getClasses = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const teacherId = req.user.id;
        const role = req.user.role;

        let query = 'SELECT * FROM classes';
        const params = [];

        if (role !== 'admin') {
            query += ' WHERE teacher_id = ?';
            params.push(teacherId);
        }

        query += ' ORDER BY school_year DESC, name ASC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM classes WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lớp không tồn tại' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Lỗi lấy thông tin lớp:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const createClass = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const { name, school_year, start_date } = req.body;
        const teacherId = req.user.id;

        if (!name || !school_year) {
            return res.status(400).json({ message: 'Thiếu tên lớp hoặc năm học' });
        }

        const [existingClass] = await connection.query(
            'SELECT id FROM classes WHERE name = ? AND school_year = ?',
            [name, school_year]
        );

        if (existingClass.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Lớp học này đã tồn tại trong niên khóa này!' });
        }

        const years = school_year.split('-');
        let suffix = '';
        if (years.length === 2) {
            suffix = years[0].slice(-2) + years[1].slice(-2);
        } else {
            suffix = school_year.slice(-2);
        }

        const generatedUsername = (name.replace(/\s/g, '') + suffix).toUpperCase();

        const [existingUser] = await connection.query('SELECT id FROM users WHERE username = ?', [
            generatedUsername,
        ]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res
                .status(400)
                .json({ message: `Tài khoản lớp ${generatedUsername} đã tồn tại!` });
        }

        const scheduleConfig = generateDefaultSchedule(start_date);

        const [result] = await connection.query(
            'INSERT INTO classes (name, school_year, teacher_id, start_date, schedule_config) VALUES (?, ?, ?, ?, ?)',
            [name, school_year, teacherId, start_date || null, scheduleConfig]
        );

        const newClassId = result.insertId;

        const hashedPassword = await bcrypt.hash('123456', 10);
        await connection.query(
            'INSERT INTO users (username, password, full_name, role_id, class_id) VALUES (?, ?, ?, ?, ?)',
            [generatedUsername, hashedPassword, `Lớp ${name}`, 6, newClassId]
        );

        await connection.commit();
        res.status(201).json({
            message: 'Tạo lớp và tài khoản lớp thành công',
            username: generatedUsername,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo lớp' });
    } finally {
        if (connection) connection.release();
    }
};

const updateClass = async (req, res) => {
    try {
        const { id } = req.params;

        const { name, school_year, start_date, schedule_config } = req.body;
        const teacherId = req.user.id;
        const role = req.user.role;

        if (role !== 'admin') {
            const [check] = await db.query(
                'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
                [id, teacherId]
            );
            if (check.length === 0) {
                return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lớp này' });
            }
        }

        if (!name || !school_year) {
            return res.status(400).json({ message: 'Tên lớp và niên khóa là bắt buộc' });
        }

        await db.query(
            'UPDATE classes SET name = ?, school_year = ?, start_date = ?, schedule_config = ? WHERE id = ?',
            [
                name,
                school_year,
                start_date || null,
                schedule_config ? JSON.stringify(schedule_config) : null,
                id,
            ]
        );

        res.json({ message: 'Cập nhật lớp thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật lớp:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const deleteClass = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.query('DELETE FROM announcements WHERE class_id = ?', [id]);

        await connection.query('DELETE FROM daily_notes WHERE class_id = ?', [id]);

        const [users] = await connection.query('SELECT id FROM users WHERE class_id = ?', [id]);
        const userIds = users.map((u) => u.id);

        if (userIds.length > 0) {
            await connection.query(
                `DELETE FROM daily_logs WHERE student_id IN (?) OR reporter_id IN (?)`,
                [userIds, userIds]
            );

            await connection.query('DELETE FROM users WHERE class_id = ?', [id]);
        }

        await connection.query('DELETE FROM classes WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Xóa lớp và toàn bộ dữ liệu liên quan thành công' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Lỗi xóa lớp:', error);
        res.status(500).json({ message: 'Lỗi khi xóa lớp' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getClasses, getClassById, createClass, deleteClass, updateClass };
