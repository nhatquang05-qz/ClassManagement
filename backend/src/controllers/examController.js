const db = require('../config/dbConfig');
const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require('streamifier');

const uploadFromBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const isImage = file.mimetype.startsWith('image/');
        const isPdf = file.mimetype === 'application/pdf';
        const isAudio = file.mimetype.startsWith('audio/');

        let resourceType = 'raw';
        if (isImage || isPdf) resourceType = 'image';
        if (file.mimetype.startsWith('video/') || isAudio) resourceType = 'video';

        const originalName = file.originalname;
        const extension = originalName.split('.').pop();
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const customPublicId = `${nameWithoutExt}_${Date.now()}`;

        const uploadOptions = {
            folder: 'exam-media',
            resource_type: resourceType,
            public_id: customPublicId,
        };

        if (resourceType === 'raw') {
            uploadOptions.public_id = `${customPublicId}.${extension}`;
        }

        const cld_upload_stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(file.buffer).pipe(cld_upload_stream);
    });
};

const insertSectionsAndQuestions = async (connection, examId, sections) => {
    for (const [sIndex, section] of sections.entries()) {
        const [secRes] = await connection.execute(
            `INSERT INTO exam_sections (exam_id, title, description, order_index) VALUES (?, ?, ?, ?)`,
            [examId, section.title, section.description, sIndex]
        );
        const sectionId = secRes.insertId;

        if (section.questions && section.questions.length > 0) {
            const qValues = [];
            section.questions.forEach((q, qIndex) => {
                qValues.push([
                    sectionId,
                    q.type,
                    q.content,
                    q.points,
                    q.media_url || null,
                    q.media_type || null,
                    qIndex,
                    JSON.stringify(q.content_data),
                ]);
            });

            await connection.query(
                `INSERT INTO questions (section_id, type, content, points, media_url, media_type, order_index, content_data) VALUES ?`,
                [qValues]
            );
        }
    }
};

const createExam = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            classId,
            title,
            description,
            startTime,
            endTime,
            durationMinutes,
            sections,
            viewAnswerMode,
            maxAttempts,
        } = req.body;

        const [result] = await connection.execute(
            `INSERT INTO exams (class_id, title, description, start_time, end_time, duration_minutes, view_answer_mode, max_attempts, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                classId,
                title,
                description,
                startTime,
                endTime,
                durationMinutes,
                viewAnswerMode || 'after_close',
                maxAttempts || 1,
                req.user.id,
            ]
        );
        const examId = result.insertId;

        if (sections && sections.length > 0) {
            await insertSectionsAndQuestions(connection, examId, sections);
        }

        await connection.commit();
        res.status(201).json({ message: 'Tạo đề thi thành công', examId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo đề thi' });
    } finally {
        connection.release();
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
            startTime,
            endTime,
            durationMinutes,
            sections,
            viewAnswerMode,
            maxAttempts,
        } = req.body;

        await connection.execute(
            `UPDATE exams SET title = ?, description = ?, start_time = ?, end_time = ?, duration_minutes = ?, view_answer_mode = ?, max_attempts = ? WHERE id = ?`,
            [
                title,
                description,
                startTime,
                endTime,
                durationMinutes,
                viewAnswerMode || 'after_close',
                maxAttempts || 1,
                id,
            ]
        );

        const [submissions] = await connection.execute(
            'SELECT id FROM exam_submissions WHERE exam_id = ? LIMIT 1',
            [id]
        );

        if (submissions.length > 0) {
            await connection.execute(
                `UPDATE exam_sections SET order_index = -1 WHERE exam_id = ? AND order_index >= 0`,
                [id]
            );

            if (sections && sections.length > 0) {
                await insertSectionsAndQuestions(connection, id, sections);
            }
        } else {
            const [oldSections] = await connection.execute(
                'SELECT id FROM exam_sections WHERE exam_id = ?',
                [id]
            );
            const oldSectionIds = oldSections.map((s) => s.id);

            if (oldSectionIds.length > 0) {
                const placeholders = oldSectionIds.map(() => '?').join(',');
                await connection.execute(
                    `DELETE FROM questions WHERE section_id IN (${placeholders})`,
                    oldSectionIds
                );
                await connection.execute(`DELETE FROM exam_sections WHERE exam_id = ?`, [id]);
            }

            if (sections && sections.length > 0) {
                await insertSectionsAndQuestions(connection, id, sections);
            }
        }

        await connection.commit();
        res.json({ message: 'Cập nhật đề thi thành công' });
    } catch (error) {
        await connection.rollback();
        console.error('Update Exam Error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật đề thi: ' + error.message });
    } finally {
        connection.release();
    }
};

const getExamById = async (req, res) => {
    try {
        const { id } = req.params;
        const [exams] = await db.execute('SELECT * FROM exams WHERE id = ?', [id]);
        if (exams.length === 0) return res.status(404).json({ message: 'Not found' });

        const exam = exams[0];

        const [rows] = await db.execute(
            `
            SELECT s.id as s_id, s.title as s_title, s.description as s_desc,
                   q.id as q_id, q.type, q.content, q.points, q.media_url, q.media_type, q.content_data
            FROM exam_sections s
            LEFT JOIN questions q ON s.id = q.section_id
            WHERE s.exam_id = ? AND s.order_index >= 0 
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
                    questions: [],
                });
            }
            if (row.q_id) {
                let cData = row.content_data;
                if (typeof cData === 'string') {
                    try {
                        cData = JSON.parse(cData);
                    } catch (e) {}
                }

                if (req.query.mode === 'taking') {
                    if (cData) {
                        delete cData.correct_ids;
                        delete cData.correct_answer;
                    }
                }

                sectionsMap.get(row.s_id).questions.push({
                    id: row.q_id,
                    type: row.type,
                    content: row.content,
                    points: row.points,
                    media_url: row.media_url,
                    media_type: row.media_type,
                    content_data: cData,
                });
            }
        });

        res.json({ ...exam, sections: Array.from(sectionsMap.values()) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
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
            `SELECT s.id as s_id, s.title as s_title, s.order_index,
                    q.id as q_id, q.type, q.content, q.points, q.media_url, q.media_type, q.content_data, 
                    sa.answer_data, sa.is_correct, sa.score_obtained
             FROM exam_sections s 
             JOIN questions q ON s.id = q.section_id 
             LEFT JOIN student_answers sa ON sa.question_id = q.id AND sa.submission_id = ?
             WHERE s.exam_id = ? 
             ORDER BY s.order_index, q.order_index`,
            [submissionId, sub.exam_id]
        );

        const sectionsMap = new Map();
        rows.forEach((row) => {
            if (!sectionsMap.has(row.s_id))
                sectionsMap.set(row.s_id, { title: row.s_title, questions: [] });

            if (row.q_id) {
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
                    media_type: row.media_type,
                    content_data: contentData,
                    user_answer: userAnswer,
                    is_correct: row.is_correct,
                    score_obtained: row.score_obtained,
                });
            }
        });

        const finalSections = Array.from(sectionsMap.values()).filter(
            (sec) => sec.questions.length > 0
        );

        res.json({ exam: sub, sections: finalSections });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
};

const startExam = async (req, res) => {
    try {
        const { examId } = req.body;
        const studentId = req.user.id;

        const [exams] = await db.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        if (!exams.length) return res.status(404).json({ message: 'Exam not found' });
        const exam = exams[0];

        const now = new Date();
        if (now < new Date(exam.start_time) || now > new Date(exam.end_time)) {
            return res.status(400).json({ message: 'Ngoài thời gian làm bài' });
        }

        const [attempts] = await db.execute(
            'SELECT COUNT(*) as count FROM exam_submissions WHERE exam_id = ? AND student_id = ?',
            [examId, studentId]
        );
        if (exam.max_attempts !== 999 && attempts[0].count >= exam.max_attempts) {
            return res.status(400).json({ message: 'Hết lượt làm bài' });
        }

        const [result] = await db.execute(
            `INSERT INTO exam_submissions (exam_id, student_id, started_at) VALUES (?, ?, NOW())`,
            [examId, studentId]
        );

        res.json({
            submissionId: result.insertId,
            startedAt: new Date(),
            durationMinutes: exam.duration_minutes,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error starting exam' });
    }
};

const submitExam = async (req, res) => {
    let connection;
    let retries = 3;

    while (retries > 0) {
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            const { submissionId, answers } = req.body;

            const [subs] = await connection.execute('SELECT * FROM exam_submissions WHERE id = ?', [
                submissionId,
            ]);
            if (!subs.length) {
                await connection.rollback();
                return res.status(404).json({ message: 'Not found' });
            }
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
                        if (correctData.correct_ids?.some((id) => String(id) === String(userAns)))
                            isCorrect = true;
                    } else if (q.type === 'fill_in_blank') {
                        if (
                            String(userAns).trim().toLowerCase() ===
                            String(correctData.correct_answer).trim().toLowerCase()
                        )
                            isCorrect = true;
                    } else if (q.type === 'matching' && typeof userAns === 'object') {
                        const correctPairs = correctData.pairs || [];
                        let matchCount = 0;
                        correctPairs.forEach((p) => {
                            if (userAns[p.left] === p.right) matchCount++;
                        });
                        if (matchCount === correctPairs.length && matchCount > 0) isCorrect = true;
                    } else if (q.type === 'ordering' && Array.isArray(userAns)) {
                        const correctItems = correctData.items || [];
                        let orderMatch = true;
                        if (userAns.length === correctItems.length) {
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
            return res.json({ message: 'Success', score: earnedScore });
        } catch (error) {
            if (connection) await connection.rollback();
            if (error.errno === 1213) {
                retries--;
                await new Promise((r) => setTimeout(r, 200));
            } else {
                console.error(error);
                return res.status(500).json({ message: error.message });
            }
        } finally {
            if (connection) connection.release();
        }
    }
};

const getExamsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.id;
        let query = `
            SELECT e.*, 
            (SELECT COUNT(*) FROM exam_submissions es WHERE es.exam_id = e.id AND es.student_id = ?) as attempt_count,
            (SELECT MAX(score) FROM exam_submissions es WHERE es.exam_id = e.id AND es.student_id = ?) as best_score,
            (SELECT id FROM exam_submissions es WHERE es.exam_id = e.id AND es.student_id = ? ORDER BY es.id DESC LIMIT 1) as last_submission_id
            FROM exams e
            WHERE e.class_id = ?
            ORDER BY e.created_at DESC
        `;
        const [rows] = await db.execute(query, [userId, userId, userId, classId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách đề thi' });
    }
};

const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM exams WHERE id = ?', [id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

const getExamSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(
            `
            SELECT es.*, u.full_name as student_name, 
            ROW_NUMBER() OVER (PARTITION BY es.student_id ORDER BY es.submitted_at ASC) as attempt_number
            FROM exam_submissions es
            JOIN users u ON es.student_id = u.id
            WHERE es.exam_id = ? AND es.submitted_at IS NOT NULL
            ORDER BY es.submitted_at DESC
        `,
            [id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
};

const uploadExamMedia = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền upload' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file' });
        }
        const result = await uploadFromBuffer(req.file);
        let mediaType = 'image';
        if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
        if (req.file.mimetype.startsWith('audio/')) mediaType = 'audio';

        res.json({ url: result.secure_url, public_id: result.public_id, media_type: mediaType });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload media' });
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
    uploadExamMedia,
};
