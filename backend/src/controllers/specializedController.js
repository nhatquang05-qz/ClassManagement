const db = require('../config/dbConfig');

const getTable = (type) => {
    if (type === 'study') return 'study_violations';
    if (type === 'monitor') return 'monitor_violations';
    return null;
};

const getData = async (req, res) => {
    try {
        const { class_id, week, type } = req.query;
        const tableName = getTable(type);
        if (!tableName) return res.status(400).json({ message: 'Invalid type' });

        const [violations] = await db.query(
            `SELECT 
                v.id,
                DATE_FORMAT(v.date, '%Y-%m-%d') as date, 
                v.week_number,
                v.group_number,
                v.student_id,
                v.violation_type,
                v.note,
                v.created_at,
                u.full_name as student_name 
             FROM ${tableName} v 
             LEFT JOIN users u ON v.student_id = u.id
             WHERE v.class_id = ? AND v.week_number = ?
             ORDER BY v.created_at DESC`,
            [class_id, week]
        );

        res.json({ violations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const createViolation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const {
            class_id,
            date,
            week_number,
            group_number,
            student_ids,
            violation_type,
            note,
            reporter_id,
            type,
        } = req.body;

        const tableName = getTable(type);
        if (!tableName) return res.status(400).json({ message: 'Invalid type' });

        await connection.beginTransaction();

        if (!student_ids || student_ids.length === 0) {
            await connection.query(
                `INSERT INTO ${tableName} (class_id, date, week_number, group_number, student_id, violation_type, note, reporter_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [class_id, date, week_number, group_number, null, violation_type, note, reporter_id]
            );
        } else {
            const values = student_ids.map((id) => [
                class_id,
                date,
                week_number,
                group_number,
                id,
                violation_type,
                note,
                reporter_id,
            ]);

            await connection.query(
                `INSERT INTO ${tableName} (class_id, date, week_number, group_number, student_id, violation_type, note, reporter_id)
                 VALUES ?`,
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Đã lưu' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi lưu dữ liệu' });
    } finally {
        connection.release();
    }
};

const deleteViolation = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        const tableName = getTable(type);
        if (!tableName) return res.status(400).json({ message: 'Invalid type' });

        const ids = id.split(',').map((num) => parseInt(num));
        await db.query(`DELETE FROM ${tableName} WHERE id IN (?)`, [ids]);
        res.json({ message: 'Đã xóa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa' });
    }
};

module.exports = { getData, createViolation, deleteViolation };
