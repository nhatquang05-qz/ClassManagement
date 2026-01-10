
const db = require('../config/dbConfig');


const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


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
            sections 
        } = req.body;
        
        const created_by = req.user.id; 

        
        const [examResult] = await connection.execute(
            `INSERT INTO exams 
            (class_id, created_by, title, description, start_time, end_time, duration_minutes, max_attempts, view_answer_mode, is_shuffled) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [class_id, created_by, title, description, start_time, end_time, duration_minutes, max_attempts, view_answer_mode, is_shuffled]
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
                            [sectionId, q.type, q.content, q.media_url, q.points, contentDataJson, j]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Tạo đề thi thành công', examId });

    } catch (error) {
        await connection.rollback(); 
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo đề thi', error: error.message });
    } finally {
        connection.release();
    }
};


const getExamById = async (req, res) => {
    try {
        const { id } = req.params;
        const isTeacher = req.user.role === 'admin' || req.user.role === 'teacher'; 

        
        const [exams] = await db.execute(`SELECT * FROM exams WHERE id = ?`, [id]);
        if (exams.length === 0) return res.status(404).json({ message: 'Không tìm thấy đề thi' });
        const exam = exams[0];

        
        
        const [rows] = await db.execute(`
            SELECT 
                s.id as s_id, s.title as s_title, s.description as s_desc, s.media_url as s_media, s.media_type, s.order_index as s_order,
                q.id as q_id, q.type, q.content, q.media_url as q_media, q.points, q.content_data, q.order_index as q_order
            FROM exam_sections s
            LEFT JOIN questions q ON s.id = q.section_id
            WHERE s.exam_id = ?
            ORDER BY s.order_index ASC, q.order_index ASC
        `, [id]);

        
        const sectionsMap = new Map();

        rows.forEach(row => {
            if (!sectionsMap.has(row.s_id)) {
                sectionsMap.set(row.s_id, {
                    id: row.s_id,
                    title: row.s_title,
                    description: row.s_desc,
                    media_url: row.s_media,
                    media_type: row.media_type,
                    questions: []
                });
            }

            if (row.q_id) { 
                let contentData = row.content_data; 
                
                if (!isTeacher) {
                    if (contentData.correct_ids) delete contentData.correct_ids;
                    if (contentData.correct_answer) delete contentData.correct_answer;
                    if (contentData.correct_order) delete contentData.correct_order;
                    
                    if (contentData.blanks) {
                        contentData.blanks = contentData.blanks.map(b => ({ position: b.position })); 
                    }
                    if (contentData.pairs) {
                        
                        
                    }
                }

                sectionsMap.get(row.s_id).questions.push({
                    id: row.q_id,
                    type: row.type,
                    content: row.content,
                    media_url: row.q_media,
                    points: row.points,
                    content_data: contentData
                });
            }
        });

        let sections = Array.from(sectionsMap.values());

        
        if (!isTeacher && exam.is_shuffled) {
            sections = sections.map(section => {
                
                section.questions = shuffleArray(section.questions);
                return section;
            });
        }

        res.status(200).json({ ...exam, sections });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = {
    createExam,
    getExamById
};