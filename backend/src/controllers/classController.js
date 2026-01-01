const db = require('../config/dbConfig');

const getMyClasses = async (req, res) => {
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
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, school_year } = req.body;
    const teacherId = req.user.id;

    if (!name || !school_year) {
      return res.status(400).json({ message: 'Thiếu tên lớp hoặc năm học' });
    }

    await db.query('INSERT INTO classes (name, school_year, teacher_id) VALUES (?, ?, ?)', [
      name,
      school_year,
      teacherId,
    ]);
    res.status(201).json({ message: 'Tạo lớp thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi tạo lớp' });
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

module.exports = { getMyClasses, createClass, deleteClass };
