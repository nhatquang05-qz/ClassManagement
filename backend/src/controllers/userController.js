const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

const getUsers = async (req, res) => {
    try {
        const { class_id, group_number } = req.query;
        let query = `
      SELECT u.id, u.full_name, u.username, u.group_number, u.role_id, u.is_locked, u.class_id,
             r.display_name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role_id != 1
    `;
        const params = [];

        if (class_id) {
            query += ` AND u.class_id = ?`;
            params.push(class_id);
        }
        if (group_number) {
            query += ` AND u.group_number = ?`;
            params.push(group_number);
        }

        query += ` ORDER BY u.group_number ASC, u.role_id ASC, u.full_name ASC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách' });
    }
};

const createUser = async (req, res) => {
    try {
        const { full_name, group_number, class_id, role_id } = req.body;
        if (!full_name || !class_id) return res.status(400).json({ message: 'Thiếu thông tin' });

        const username = `hs${Date.now()}`;
        const defaultHash = await bcrypt.hash('123456', 10);

        await db.query(
            `INSERT INTO users (username, password, full_name, role_id, group_number, class_id, is_locked) 
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [username, defaultHash, full_name, role_id || 6, group_number || 0, class_id]
        );
        res.json({ message: 'Thêm thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thêm học sinh' });
    }
};

const importStudents = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { class_id } = req.body;
        if (!req.file || !class_id) return res.status(400).json({ message: 'Thiếu file/Lớp' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        await connection.beginTransaction();
        const defaultHash = await bcrypt.hash('123456', 10);

        for (let row of data) {
            const fullName = row['HoTen'] || row['Họ và tên'];
            const groupNum = row['To'] || row['Tổ'] || 0;
            const username = `hs${Date.now()}${Math.floor(Math.random() * 100)}`;
            if (fullName) {
                await connection.query(
                    `INSERT INTO users (username, password, full_name, role_id, group_number, class_id, is_locked) 
                     VALUES (?, ?, ?, 6, ?, ?, 0)`,
                    [username, defaultHash, fullName, groupNum, class_id]
                );
            }
        }
        await connection.commit();
        res.json({ message: `Đã thêm ${data.length} học sinh.` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Lỗi file Excel' });
    } finally {
        connection.release();
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_locked, role_id, full_name, group_number } = req.body;

        let query = 'UPDATE users SET ';
        const updates = [];
        const params = [];

        if (is_locked !== undefined) {
            updates.push('is_locked = ?');
            params.push(is_locked);
        }
        if (role_id) {
            updates.push('role_id = ?');
            params.push(role_id);
        }
        if (full_name) {
            updates.push('full_name = ?');
            params.push(full_name);
        }
        if (group_number) {
            updates.push('group_number = ?');
            params.push(group_number);
        }

        if (updates.length === 0) return res.json({ message: 'Không có thay đổi' });

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};

const bulkUpdateGroup = async (req, res) => {
    try {
        const { student_ids, group_number } = req.body;
        if (!student_ids?.length) return res.status(400).json({ message: 'Chưa chọn học sinh' });

        const placeholders = student_ids.map(() => '?').join(',');
        await db.query(`UPDATE users SET group_number = ? WHERE id IN (${placeholders})`, [
            group_number,
            ...student_ids,
        ]);
        res.json({ message: 'Đã chuyển tổ thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi chuyển tổ' });
    }
};

module.exports = { getUsers, importStudents, updateUser, createUser, bulkUpdateGroup };
