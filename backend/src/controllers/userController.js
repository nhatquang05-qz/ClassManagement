const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

function removeAccents(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

function generateNamePart(fullName) {
    const cleanName = removeAccents(fullName).trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    const firstName = parts[parts.length - 1];
    const lastName = parts[0];
    const middleNames = parts.slice(1, parts.length - 1);
    let code = firstName.charAt(0).toUpperCase();
    code += lastName.charAt(0).toUpperCase();
    middleNames.forEach((m) => {
        code += m.charAt(0).toUpperCase();
    });
    return code;
}

function generateYearPart(schoolYear) {
    const years = schoolYear.match(/\d+/g);
    if (!years || years.length < 2) return '';
    return years[0].slice(-2) + years[1].slice(-2);
}

async function generateUniqueUsername(fullName, classId, connection, existingUsernamesSet = null) {
    const [classes] = await connection.query('SELECT name, school_year FROM classes WHERE id = ?', [
        classId,
    ]);
    if (classes.length === 0) throw new Error('Không tìm thấy lớp');
    const { name: className, school_year } = classes[0];
    const namePart = generateNamePart(fullName);
    const classPart = className.replace(/\s+/g, '').toUpperCase();
    const yearPart = generateYearPart(school_year);
    const baseUsername = `${namePart}${classPart}${yearPart}`;
    let finalUsername = baseUsername;
    let suffix = 0;
    while (true) {
        const check = suffix === 0 ? baseUsername : `${baseUsername}${suffix}`;
        if (existingUsernamesSet && existingUsernamesSet.has(check)) {
            suffix++;
            continue;
        }
        const [rows] = await connection.query('SELECT id FROM users WHERE username = ?', [check]);
        if (rows.length > 0) {
            suffix++;
        } else {
            finalUsername = check;
            break;
        }
    }
    return finalUsername;
}

const getUsers = async (req, res) => {
    try {
        const { class_id, group_number } = req.query;

        let query = `
      SELECT u.id, u.full_name, u.username, u.group_number, u.monitoring_group, u.role_id, u.is_locked, u.class_id, u.last_active_at,
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
        const { full_name, group_number, class_id, role_id, monitoring_group } = req.body;
        if (!full_name || !class_id) return res.status(400).json({ message: 'Thiếu thông tin' });

        const username = await generateUniqueUsername(full_name, class_id, db);
        const defaultHash = await bcrypt.hash('123456', 10);

        const monitorGroupVal = role_id == 5 ? monitoring_group || null : null;

        await db.query(
            `INSERT INTO users (username, password, full_name, role_id, group_number, monitoring_group, class_id, is_locked, must_change_password) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)`,
            [
                username,
                defaultHash,
                full_name,
                role_id || 6,
                group_number || 0,
                monitorGroupVal,
                class_id,
            ]
        );
        res.json({ message: 'Thêm thành công', username });
    } catch (error) {
        console.error(error);
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
        const generatedUsernamesSet = new Set();
        for (let row of data) {
            const fullName = row['HoTen'] || row['Họ và tên'];
            const groupNum = row['To'] || row['Tổ'] || 0;
            if (fullName) {
                const username = await generateUniqueUsername(
                    fullName,
                    class_id,
                    connection,
                    generatedUsernamesSet
                );
                generatedUsernamesSet.add(username);
                await connection.query(
                    `INSERT INTO users (username, password, full_name, role_id, group_number, class_id, is_locked, must_change_password) VALUES (?, ?, ?, 6, ?, ?, 0, 1)`,
                    [username, defaultHash, fullName, groupNum, class_id]
                );
            }
        }
        await connection.commit();
        res.json({ message: `Đã thêm ${data.length} học sinh.` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi file Excel' });
    } finally {
        connection.release();
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_locked, role_id, full_name, group_number, monitoring_group } = req.body;

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

        if (monitoring_group !== undefined) {
            updates.push('monitoring_group = ?');
            const val =
                role_id == 5 || (role_id === undefined && monitoring_group)
                    ? monitoring_group
                    : null;
            params.push(val);
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

const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const defaultHash = await bcrypt.hash('123456', 10);
        await db.query('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?', [
            defaultHash,
            id,
        ]);
        res.json({ message: 'Đã khôi phục mật khẩu về 123456' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi reset mật khẩu' });
    }
};

const deleteUser = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();

        await connection.query('DELETE FROM daily_logs WHERE student_id = ? OR reporter_id = ?', [
            id,
            id,
        ]);
        await connection.query('DELETE FROM audit_logs WHERE user_id = ?', [id]);

        await connection.query('DELETE FROM users WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Đã xóa học sinh thành công' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa học sinh' });
    } finally {
        connection.release();
    }
};

const bulkDeleteUsers = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { student_ids } = req.body;
        if (!student_ids || student_ids.length === 0) {
            return res.status(400).json({ message: 'Chưa chọn học sinh để xóa' });
        }

        const placeholders = student_ids.map(() => '?').join(',');

        await connection.beginTransaction();

        await connection.query(
            `DELETE FROM daily_logs WHERE student_id IN (${placeholders}) OR reporter_id IN (${placeholders})`,
            [...student_ids, ...student_ids]
        );

        await connection.query(
            `DELETE FROM audit_logs WHERE user_id IN (${placeholders})`,
            student_ids
        );

        await connection.query(`DELETE FROM users WHERE id IN (${placeholders})`, student_ids);

        await connection.commit();
        res.json({ message: `Đã xóa thành công ${student_ids.length} học sinh.` });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi xóa hàng loạt:', error);
        res.status(500).json({ message: 'Lỗi khi xóa danh sách học sinh' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getUsers,
    importStudents,
    updateUser,
    createUser,
    bulkUpdateGroup,
    resetPassword,
    deleteUser,
    bulkDeleteUsers,
};
