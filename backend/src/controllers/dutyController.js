const db = require('../config/dbConfig');

const getDutyData = async (req, res) => {
    try {
        const { class_id, week } = req.query;

        const [schedules] = await db.query(
            'SELECT * FROM duty_schedules WHERE class_id = ? AND week_number = ?',
            [class_id, week]
        );

        const [violations] = await db.query(
            `SELECT 
                dv.id,
                DATE_FORMAT(dv.date, '%Y-%m-%d') as date, 
                dv.week_number,
                dv.group_number,
                dv.student_id,
                dv.violation_type,
                dv.note,
                dv.reporter_id,
                dv.created_at,
                u.full_name as student_name 
             FROM duty_violations dv 
             LEFT JOIN users u ON dv.student_id = u.id
             WHERE dv.class_id = ? AND dv.week_number = ?
             ORDER BY dv.created_at DESC`,
            [class_id, week]
        );

        res.json({ schedules, violations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const toggleSchedule = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { class_id, week_number, day_of_week, group_number, assigned } = req.body;

        if (assigned) {
            await connection.query(
                `INSERT IGNORE INTO duty_schedules (class_id, week_number, day_of_week, group_number) 
                 VALUES (?, ?, ?, ?)`,
                [class_id, week_number, day_of_week, group_number]
            );
        } else {
            await connection.query(
                `DELETE FROM duty_schedules 
                 WHERE class_id = ? AND week_number = ? AND day_of_week = ? AND group_number = ?`,
                [class_id, week_number, day_of_week, group_number]
            );
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lưu lịch' });
    } finally {
        connection.release();
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
        } = req.body;

        await connection.beginTransaction();

        if (!student_ids || student_ids.length === 0) {
            await connection.query(
                `INSERT INTO duty_violations (class_id, date, week_number, group_number, student_id, violation_type, note, reporter_id)
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
                `INSERT INTO duty_violations (class_id, date, week_number, group_number, student_id, violation_type, note, reporter_id)
                 VALUES ?`,
                [values]
            );
        }

        await connection.commit();
        res.json({ message: 'Đã lưu vi phạm' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi lưu vi phạm' });
    } finally {
        connection.release();
    }
};

const deleteViolation = async (req, res) => {
    try {
        const { id } = req.params;

        const ids = id.split(',').map((num) => parseInt(num));

        await db.query('DELETE FROM duty_violations WHERE id IN (?)', [ids]);
        res.json({ message: 'Đã xóa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa' });
    }
};

module.exports = { getDutyData, toggleSchedule, createViolation, deleteViolation };
