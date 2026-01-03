const db = require('../config/dbConfig');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');


const uploadFromBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
            { folder: 'class_management_docs', resource_type: 'auto' },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
    });
};

const getAnnouncements = async (req, res) => {
    try {
        const { class_id, search } = req.query;
        let query = `
            SELECT a.*, u.full_name as author_name 
            FROM announcements a
            JOIN users u ON a.user_id = u.id
            WHERE a.class_id = ?
        `;
        const params = [class_id];

        if (search) {
            query += ` AND (a.title LIKE ? OR a.content LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY a.is_pinned DESC, a.created_at DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu' });
    }
};

const createAnnouncement = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { class_id, title, content } = req.body;
        const user_id = req.user.id;
        let file_url = null;
        let file_name = null;
        let file_type = null;

        if (req.file) {
            const result = await uploadFromBuffer(req.file.buffer);
            file_url = result.secure_url;
            file_name = req.file.originalname;
            file_type = result.format || req.file.mimetype.split('/')[1];
        }

        await connection.query(
            `INSERT INTO announcements (class_id, user_id, title, content, file_url, file_name, file_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [class_id, user_id, title, content, file_url, file_name, file_type]
        );

        res.status(201).json({ message: 'Đăng thông báo thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi đăng bài' });
    } finally {
        connection.release();
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query('DELETE FROM announcements WHERE id = ?', [id]);
        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa' });
    }
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
};