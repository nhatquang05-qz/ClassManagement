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

const submitExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { submissionId, answers } = req.body;

        const [subs] = await connection.execute('SELECT * FROM exam_submissions WHERE id = ?', [
            submissionId,
        ]);
        if (!subs.length) throw new Error('Submission not found');
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

            const userAns = answers[q.id] || answers[String(q.id)];

            let correctData = q.content_data;
            if (typeof correctData === 'string') {
                try {
                    correctData = JSON.parse(correctData);
                } catch (e) {}
            }

            let isCorrect = false;

            if (userAns !== undefined && userAns !== null && userAns !== '') {
                if (q.type === 'multiple_choice') {
                    if (correctData.correct_ids?.some((id) => String(id) === String(userAns))) {
                        isCorrect = true;
                    }
                } else if (q.type === 'fill_in_blank') {
                    if (
                        String(userAns).trim().toLowerCase() ===
                        String(correctData.correct_answer).trim().toLowerCase()
                    ) {
                        isCorrect = true;
                    }
                } else if (q.type === 'matching') {
                    const correctPairs = correctData.pairs || [];
                    let matchCount = 0;
                    if (typeof userAns === 'object') {
                        correctPairs.forEach((p) => {
                            if (userAns[p.left] === p.right) matchCount++;
                        });
                        if (matchCount === correctPairs.length && matchCount > 0) isCorrect = true;
                    }
                } else if (q.type === 'ordering') {
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
                JSON.stringify(userAns === undefined ? null : userAns),
                isCorrect ? 1 : 0,
                isCorrect ? points : 0,
            ]);
        }

        earnedScore = Math.round(earnedScore * 100) / 100;

        await connection.execute('DELETE FROM student_answers WHERE submission_id = ?', [
            submissionId,
        ]);
        await connection.execute(
            `UPDATE exam_submissions SET submitted_at = NOW(), score = ? WHERE id = ?`,
            [earnedScore, submissionId]
        );

        if (details.length > 0) {
            await connection.query(
                `INSERT INTO student_answers (submission_id, question_id, answer_data, is_correct, score_obtained) VALUES ?`,
                [details]
            );
        }

        await connection.commit();
        res.json({ message: 'Success', score: earnedScore });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

const getSubmissionDetail = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const [subs] = await db.execute(
            `SELECT es.*, e.title, e.view_answer_mode, u.full_name as student_name
             FROM exam_submissions es 
             JOIN exams e ON es.exam_id = e.id 
             JOIN users u ON es.student_id = u.id
             WHERE es.id = ?`,
            [submissionId]
        );

        if (!subs.length) return res.status(404).json({ message: 'Not found' });
        const sub = subs[0];

        const [rows] = await db.execute(
            `SELECT s.id as s_id, s.title as s_title, 
                    q.id as q_id, q.type, q.content, q.points, q.media_url, q.content_data, 
                    sa.answer_data, sa.is_correct, sa.score_obtained
             FROM exam_sections s 
             JOIN questions q ON s.id = q.section_id 
             LEFT JOIN student_answers sa ON sa.question_id = q.id AND sa.submission_id = ?
             WHERE s.exam_id = ? 
             ORDER BY s.order_index, q.order_index`,
            [submissionId, sub.exam_id]
        );

        const sectionsMap = new Map();
        const processedQuestions = new Set();

        rows.forEach((row) => {
            if (!sectionsMap.has(row.s_id))
                sectionsMap.set(row.s_id, { title: row.s_title, questions: [] });

            if (!processedQuestions.has(row.q_id)) {
                processedQuestions.add(row.q_id);

                let contentData = row.content_data;

                if (typeof contentData === 'string') {
                    try {
                        contentData = JSON.parse(contentData);
                    } catch (e) {}
                }

                let userAnswer = row.answer_data;
                if (typeof userAnswer === 'string') {
                    try {
                        userAnswer = JSON.parse(userAnswer);
                    } catch (e) {}
                }

                if (sub.view_answer_mode === 'never') {
                    if (contentData) {
                        delete contentData.correct_ids;
                        delete contentData.correct_answer;
                    }
                }

                sectionsMap.get(row.s_id).questions.push({
                    id: row.q_id,
                    type: row.type,
                    content: row.content,
                    points: row.points,
                    media_url: row.media_url,
                    content_data: contentData,
                    user_answer: userAnswer,
                    is_correct: row.is_correct,
                    score_obtained: row.score_obtained,
                });
            }
        });

        res.json({ exam: sub, sections: Array.from(sectionsMap.values()) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
};

const getExamById = async (req, res) => {
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
                const safeData = { ...row.content_data };

                sectionsMap.get(row.s_id).questions.push({
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

const updateExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
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

        await connection.execute(
            `UPDATE exams SET title=?, description=?, start_time=?, end_time=?, duration_minutes=?, max_attempts=?, view_answer_mode=?, is_shuffled=? WHERE id=?`,
            [
                title,
                description,
                start_time,
                end_time,
                duration_minutes,
                max_attempts,
                view_answer_mode,
                is_shuffled,
                id,
            ]
        );

        const [oldSections] = await connection.execute(
            'SELECT id FROM exam_sections WHERE exam_id = ?',
            [id]
        );
        if (oldSections.length > 0) {
            const sectionIds = oldSections.map((s) => s.id).join(',');
            await connection.execute(`DELETE FROM questions WHERE section_id IN (${sectionIds})`);
            await connection.execute(`DELETE FROM exam_sections WHERE exam_id = ?`, [id]);
        }

        if (sections?.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                const sec = sections[i];
                const [secRes] = await connection.execute(
                    `INSERT INTO exam_sections (exam_id, title, description, media_url, media_type, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, sec.title, sec.description, sec.media_url, sec.media_type, i]
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
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật bài thi' });
    } finally {
        connection.release();
    }
};

const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM exams WHERE id = ?', [id]);
        res.json({ message: 'Đã xóa bài kiểm tra' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa bài kiểm tra' });
    }
};

const getExamSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT es.*, u.full_name as student_name
            FROM exam_submissions es
            JOIN users u ON es.student_id = u.id
            WHERE es.exam_id = ? AND es.submitted_at IS NOT NULL
            ORDER BY es.score DESC, es.submitted_at ASC
        `;
        const [submissions] = await db.execute(query, [id]);
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bài nộp' });
    }
};

module.exports = {
    createExam,
    getExamsByClass,
    startExam,
    submitExam,
    getSubmissionDetail,
    getExamById,
    updateExam,
    deleteExam,
    getExamSubmissions,
};
