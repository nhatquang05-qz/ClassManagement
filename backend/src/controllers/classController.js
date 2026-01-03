const db = require('../config/dbConfig');

const getClasses = async (req, res) => {
    try {
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

const createClass = async (req, res) => {
    try {
        const { name, school_year, start_date } = req.body;
        const teacherId = req.user.id;

        if (!name || !school_year) {
            return res.status(400).json({ message: 'Thiếu tên lớp hoặc năm học' });
        }

        await db.query(
            'INSERT INTO classes (name, school_year, teacher_id, start_date) VALUES (?, ?, ?, ?)',
            [name, school_year, teacherId, start_date || null]
        );
        res.status(201).json({ message: 'Tạo lớp thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo lớp' });
    }
};

const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, school_year, start_date } = req.body;
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
            'UPDATE classes SET name = ?, school_year = ?, start_date = ? WHERE id = ?',
            [name, school_year, start_date || null, id]
        );

        res.json({ message: 'Cập nhật lớp thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật lớp:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM classes WHERE id = ?', [id]);
        res.json({ message: 'Xóa lớp thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa lớp' });
    }
};

module.exports = { getClasses, createClass, deleteClass, updateClass };
