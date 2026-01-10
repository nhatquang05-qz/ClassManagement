const db = require('../config/dbConfig');

// 1. TẠO ĐỀ THI
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

        const [examRes] = await connection.execute(
            `INSERT INTO exams (class_id, created_by, title, description, start_time, end_time, duration_minutes, max_attempts, view_answer_mode, is_shuffled) 
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
        const examId = examRes.insertId;

        if (sections?.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                const sec = sections[i];
                const [secRes] = await connection.execute(
                    `INSERT INTO exam_sections (exam_id, title, description, media_url, media_type, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
                    [examId, sec.title, sec.description, sec.media_url, sec.media_type, i]
                );
                const sectionId = secRes.insertId;

                if (sec.questions?.length > 0) {
                    for (let j = 0; j < sec.questions.length; j++) {
                        const q = sec.questions[j];
                        const contentData = JSON.stringify(q.content_data);
                        await connection.execute(
                            `INSERT INTO questions (section_id, type, content, media_url, points, content_data, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [sectionId, q.type, q.content, q.media_url, q.points, contentData, j]
                        );
                    }
                }
            }
        }
        await connection.commit();
        res.status(201).json({ message: 'OK', examId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// 2. LẤY DANH SÁCH (Kèm thống kê lịch sử)
const getExamsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const studentId = req.user.id;
        const query = `
            SELECT e.*, 
            (SELECT COUNT(*) FROM exam_submissions es WHERE es.exam_id = e.id AND es.student_id = ?) as attempt_count,
            (SELECT MAX(score) FROM exam_submissions es WHERE es.exam_id = e.id AND es.student_id = ?) as best_score,
            (SELECT id FROM exam_submissions es WHERE es.exam_id = e.id AND es.student_id = ? ORDER BY id DESC LIMIT 1) as last_submission_id
            FROM exams e WHERE class_id = ? ORDER BY created_at DESC`;
        const [exams] = await db.execute(query, [studentId, studentId, studentId, classId]);
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

// 3. START EXAM
const startExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { examId } = req.body;
        const studentId = req.user.id;
        const [exams] = await connection.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        if (!exams.length) return res.status(404).json({ message: 'Not found' });
        const exam = exams[0];

        const [existing] = await connection.execute(
            'SELECT * FROM exam_submissions WHERE exam_id = ? AND student_id = ? ORDER BY attempt_number DESC LIMIT 1',
            [examId, studentId]
        );
        let submissionId,
            startedAt,
            attempt = 1;

        if (existing.length > 0) {
            const last = existing[0];
            if (!last.submitted_at) {
                // Resume
                return res.json({
                    submissionId: last.id,
                    startedAt: last.started_at,
                    durationMinutes: exam.duration_minutes,
                });
            }
            if (exam.max_attempts !== 999 && last.attempt_number >= exam.max_attempts)
                return res.status(403).json({ message: 'Max attempts reached' });
            attempt = last.attempt_number + 1;
        }

        const [newSub] = await connection.execute(
            `INSERT INTO exam_submissions (exam_id, student_id, started_at, attempt_number) VALUES (?, ?, NOW(), ?)`,
            [examId, studentId, attempt]
        );
        const [timeRes] = await connection.execute(
            'SELECT started_at FROM exam_submissions WHERE id = ?',
            [newSub.insertId]
        );

        res.json({
            submissionId: newSub.insertId,
            startedAt: timeRes[0].started_at,
            durationMinutes: exam.duration_minutes,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    } finally {
        connection.release();
    }
};

// 4. SUBMIT EXAM
const submitExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { submissionId, answers } = req.body;
        const [subs] = await connection.execute('SELECT * FROM exam_submissions WHERE id = ?', [
            submissionId,
        ]);
        const examId = subs[0].exam_id;

        const [questions] = await connection.execute(
            `SELECT q.id, q.type, q.points, q.content_data FROM questions q JOIN exam_sections s ON q.section_id = s.id WHERE s.exam_id = ?`,
            [examId]
        );

        let totalScore = 0,
            earnedScore = 0;
        const details = [];

        for (const q of questions) {
            const points = parseFloat(q.points);
            totalScore += points;
            const userAns = answers[q.id];
            const correctData = q.content_data;
            let isCorrect = false;

            if (userAns) {
                if (q.type === 'multiple_choice' && correctData.correct_ids?.includes(userAns))
                    isCorrect = true;
                else if (
                    q.type === 'fill_in_blank' &&
                    String(userAns).trim().toLowerCase() ===
                        String(correctData.correct_answer).trim().toLowerCase()
                )
                    isCorrect = true;
                else if (q.type === 'matching') {
                    // Logic Matching đơn giản: Đúng hết cặp mới tính điểm
                    const correctPairs = correctData.pairs || [];
                    let matchCount = 0;
                    correctPairs.forEach((p) => {
                        if (userAns[p.left] === p.right) matchCount++;
                    });
                    if (matchCount === correctPairs.length && matchCount > 0) isCorrect = true;
                } else if (q.type === 'ordering') {
                    // Logic Ordering: So sánh thứ tự text
                    const correctItems = correctData.items || [];
                    let orderMatch = true;
                    if (Array.isArray(userAns) && userAns.length === correctItems.length) {
                        for (let k = 0; k < correctItems.length; k++) {
                            if (userAns[k].text !== correctItems[k].text) {
                                orderMatch = false;
                                break;
                            }
                        }
                        if (orderMatch) isCorrect = true;
                    } else orderMatch = false;
                }
            }
            if (isCorrect) earnedScore += points;
            details.push([
                submissionId,
                q.id,
                JSON.stringify(userAns || null),
                isCorrect ? 1 : 0,
                isCorrect ? points : 0,
            ]);
        }

        await connection.execute(
            `UPDATE exam_submissions SET submitted_at = NOW(), score = ? WHERE id = ?`,
            [earnedScore, submissionId]
        );
        if (details.length > 0)
            await connection.query(
                `INSERT INTO student_answers (submission_id, question_id, answer_data, is_correct, score_obtained) VALUES ?`,
                [details]
            );

        await connection.commit();
        res.json({ message: 'Success', score: earnedScore, total: totalScore });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// 5. GET SUBMISSION DETAIL (REVIEW)
const getSubmissionDetail = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const [subs] = await db.execute(
            `SELECT es.*, e.title, e.view_answer_mode FROM exam_submissions es JOIN exams e ON es.exam_id = e.id WHERE es.id = ?`,
            [submissionId]
        );
        if (!subs.length) return res.status(404).json({ message: 'Not found' });
        const sub = subs[0];

        const [rows] = await db.execute(
            `
            SELECT s.id as s_id, s.title as s_title, q.id as q_id, q.type, q.content, q.points, q.media_url, q.content_data, sa.answer_data, sa.is_correct, sa.score_obtained
            FROM exam_sections s 
            JOIN questions q ON s.id = q.section_id 
            LEFT JOIN student_answers sa ON sa.question_id = q.id AND sa.submission_id = ?
            WHERE s.exam_id = ? ORDER BY s.order_index, q.order_index
        `,
            [submissionId, sub.exam_id]
        );

        const sectionsMap = new Map();
        rows.forEach((row) => {
            if (!sectionsMap.has(row.s_id))
                sectionsMap.set(row.s_id, { title: row.s_title, questions: [] });

            // Ẩn đáp án nếu giáo viên không cho xem
            const contentData = row.content_data;
            if (sub.view_answer_mode === 'never') {
                delete contentData.correct_ids;
                delete contentData.correct_answer;
            }

            sectionsMap.get(row.s_id).questions.push({
                ...row,
                content_data: contentData,
                user_answer: row.answer_data,
            });
        });

        res.json({ exam: sub, sections: Array.from(sectionsMap.values()) });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

const getExamById = async (req, res) => {
    // ... Logic cũ
    try {
        const { id } = req.params;
        const [exams] = await db.execute(`SELECT * FROM exams WHERE id = ?`, [id]);
        if (!exams.length) return res.status(404).json({ message: 'Not Found' });

        const [rows] = await db.execute(
            `
            SELECT s.id as s_id, s.title as s_title, s.description as s_desc, s.media_url as s_media, s.media_type,
                   q.id as q_id, q.type, q.content, q.points, q.media_url as q_media, q.content_data
            FROM exam_sections s LEFT JOIN questions q ON s.id = q.section_id WHERE s.exam_id = ? ORDER BY s.order_index, q.order_index
        `,
            [id]
        );

        const sectionsMap = new Map();
        rows.forEach((row) => {
            if (!sectionsMap.has(row.s_id))
                sectionsMap.set(row.s_id, {
                    id: row.s_id,
                    title: row.s_title,
                    description: row.s_desc,
                    media_url: row.s_media,
                    media_type: row.media_type,
                    questions: [],
                });
            if (row.q_id) {
                // Với màn hình thi: Xoá đáp án đúng
                const safeData = { ...row.content_data };
                delete safeData.correct_ids;
                delete safeData.correct_answer;
                sectionsMap
                    .get(row.s_id)
                    .questions.push({
                        id: row.q_id,
                        type: row.type,
                        content: row.content,
                        points: row.points,
                        media_url: row.q_media,
                        content_data: safeData,
                    });
            }
        });
        res.json({ ...exams[0], sections: Array.from(sectionsMap.values()) });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

module.exports = {
    createExam,
    getExamsByClass,
    startExam,
    submitExam,
    getSubmissionDetail,
    getExamById,
};
