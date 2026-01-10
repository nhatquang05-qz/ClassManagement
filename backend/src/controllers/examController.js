const db = require('../config/dbConfig');

const createExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            class_id,
            title,
            description,
            start_time,
            end_time,
            duration_minutes,
            max_attempts,
            view_answer_mode,
            is_shuffled,
            sections,
        } = req.body;

        const created_by = req.user.id;

        const [examResult] = await connection.execute(
            `INSERT INTO exams 
            (class_id, created_by, title, description, start_time, end_time, duration_minutes, max_attempts, view_answer_mode, is_shuffled) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                class_id,
                created_by,
                title,
                description,
                start_time,
                end_time,
                duration_minutes,
                max_attempts,
                view_answer_mode,
                is_shuffled,
            ]
        );
        const examId = examResult.insertId;

        if (sections && sections.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                const sec = sections[i];
                const [secResult] = await connection.execute(
                    `INSERT INTO exam_sections (exam_id, title, description, media_url, media_type, order_index) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [examId, sec.title, sec.description, sec.media_url, sec.media_type, i]
                );
                const sectionId = secResult.insertId;

                if (sec.questions && sec.questions.length > 0) {
                    for (let j = 0; j < sec.questions.length; j++) {
                        const q = sec.questions[j];
                        const contentDataJson = JSON.stringify(q.content_data);

                        await connection.execute(
                            `INSERT INTO questions (section_id, type, content, media_url, points, content_data, order_index) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                sectionId,
                                q.type,
                                q.content,
                                q.media_url,
                                q.points,
                                contentDataJson,
                                j,
                            ]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Tạo đề thi thành công', examId });
    } catch (error) {
        await connection.rollback();
        console.error('Create Exam Error:', error);
        res.status(500).json({ message: 'Lỗi khi tạo đề thi', error: error.message });
    } finally {
        connection.release();
    }
};

const startExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { examId } = req.body;
        const studentId = req.user.id;

        const [exam] = await connection.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        if (exam.length === 0) return res.status(404).json({ message: 'Không tìm thấy đề thi' });

        const [submissions] = await connection.execute(
            'SELECT * FROM exam_submissions WHERE exam_id = ? AND student_id = ? ORDER BY attempt_number DESC LIMIT 1',
            [examId, studentId]
        );

        let attemptNumber = 1;
        if (submissions.length > 0) {
            if (!submissions[0].submitted_at) {
                return res.status(200).json({
                    message: 'Tiếp tục làm bài',
                    submissionId: submissions[0].id,
                    startedAt: submissions[0].started_at,
                    durationMinutes: exam[0].duration_minutes,
                });
            }
            attemptNumber = submissions[0].attempt_number + 1;
        }

        if (exam[0].max_attempts !== 999 && attemptNumber > exam[0].max_attempts) {
            return res.status(403).json({ message: 'Bạn đã hết lượt làm bài' });
        }

        const [result] = await connection.execute(
            `INSERT INTO exam_submissions (exam_id, student_id, started_at, attempt_number) 
             VALUES (?, ?, NOW(), ?)`,
            [examId, studentId, attemptNumber]
        );

        res.status(201).json({
            message: 'Bắt đầu làm bài',
            submissionId: result.insertId,
            startedAt: new Date(),
            durationMinutes: exam[0].duration_minutes,
        });
    } catch (error) {
        console.error('Start Exam Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    } finally {
        connection.release();
    }
};

const submitExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { submission_id, answers } = req.body;

        const [sub] = await connection.execute('SELECT * FROM exam_submissions WHERE id = ?', [
            submission_id,
        ]);
        if (sub.length === 0) throw new Error('Bài làm không tồn tại');

        const examId = sub[0].exam_id;

        const [questions] = await connection.execute(
            `SELECT q.id, q.type, q.points, q.content_data 
             FROM questions q 
             JOIN exam_sections s ON q.section_id = s.id 
             WHERE s.exam_id = ?`,
            [examId]
        );

        let totalScore = 0;
        let earnedScore = 0;
        const answerRecords = [];

        for (const q of questions) {
            const points = parseFloat(q.points);
            totalScore += points;

            const userAns = answers[q.id];
            let isCorrect = false;
            let scoreObtained = 0;

            if (userAns) {
                const correctData = q.content_data;

                if (q.type === 'multiple_choice' && correctData.correct_ids?.includes(userAns)) {
                    isCorrect = true;
                } else if (q.type === 'fill_in_blank') {
                    if (
                        String(userAns).trim().toLowerCase() ===
                        String(correctData.correct_answer).trim().toLowerCase()
                    )
                        isCorrect = true;
                } else if (q.type === 'matching' || q.type === 'ordering') {
                    isCorrect = true;
                }
            }

            if (isCorrect) scoreObtained = points;
            earnedScore += scoreObtained;

            answerRecords.push([
                submission_id,
                q.id,
                JSON.stringify(userAns),
                isCorrect,
                scoreObtained,
            ]);
        }

        await connection.execute(
            `UPDATE exam_submissions SET submitted_at = NOW(), score = ? WHERE id = ?`,
            [earnedScore, submission_id]
        );

        if (answerRecords.length > 0) {
            await connection.query(
                `INSERT INTO student_answers (submission_id, question_id, answer_data, is_correct, score_obtained) VALUES ?`,
                [answerRecords]
            );
        }

        await connection.commit();
        res.status(200).json({
            message: 'Nộp bài thành công',
            score: earnedScore,
            total: totalScore,
        });
    } catch (error) {
        await connection.rollback();
        console.error('Submit Error:', error);
        res.status(500).json({ message: 'Lỗi nộp bài' });
    } finally {
        connection.release();
    }
};

const getExamById = async (req, res) => {
    try {
        const { id } = req.params;
        const [exams] = await db.execute(`SELECT * FROM exams WHERE id = ?`, [id]);
        if (exams.length === 0) return res.status(404).json({ message: 'Không tìm thấy đề thi' });

        const [rows] = await db.execute(
            `
            SELECT s.id as s_id, s.title as s_title, s.description as s_desc, s.media_url as s_media, s.media_type,
                   q.id as q_id, q.type, q.content, q.points, q.media_url as q_media, q.content_data
            FROM exam_sections s
            LEFT JOIN questions q ON s.id = q.section_id
            WHERE s.exam_id = ?
            ORDER BY s.order_index, q.order_index
        `,
            [id]
        );

        const sectionsMap = new Map();
        rows.forEach((row) => {
            if (!sectionsMap.has(row.s_id)) {
                sectionsMap.set(row.s_id, {
                    id: row.s_id,
                    title: row.s_title,
                    description: row.s_desc,
                    media_url: row.s_media,
                    media_type: row.media_type,
                    questions: [],
                });
            }
            if (row.q_id) {
                sectionsMap.get(row.s_id).questions.push({
                    id: row.q_id,
                    type: row.type,
                    content: row.content,
                    points: row.points,
                    media_url: row.q_media,
                    content_data: row.content_data,
                });
            }
        });

        res.json({ ...exams[0], sections: Array.from(sectionsMap.values()) });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy đề thi' });
    }
};

const getExamsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const [exams] = await db.execute('SELECT * FROM exams WHERE class_id = ?', [classId]);
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi' });
    }
};

module.exports = { createExam, startExam, submitExam, getExamById, getExamsByClass };
