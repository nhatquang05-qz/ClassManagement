const db = require('../config/dbConfig');
const cloudinary = require('../config/cloudinaryConfig');
const { Readable } = require('stream');

const uploadToCloudinary = (buffer, folder = 'class-materials') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: 'auto' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
};

exports.getMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const { parentId } = req.query;

        let query = 'SELECT * FROM materials WHERE class_id = ?';
        let params = [classId];

        if (parentId && parentId !== 'null') {
            query += ' AND parent_id = ?';
            params.push(parentId);
        } else {
            query += ' AND parent_id IS NULL';
        }

        query += ' ORDER BY type ASC, created_at DESC';

        const [results] = await db.query(query, params);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi lấy tài liệu' });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const { classId } = req.params;
        const { type, title, url, parentId } = req.body;

        let finalUrl = url;
        let publicId = null;
        let mimeType = null;

        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            finalUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
            mimeType = req.file.mimetype;
        }

        const query = `
            INSERT INTO materials (class_id, parent_id, type, title, url, public_id, file_mime)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const pId = parentId === 'null' || parentId === '' ? null : parentId;

        await db.query(query, [classId, pId, type, title, finalUrl, publicId, mimeType]);
        res.status(201).json({ message: 'Tạo thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo tài liệu' });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query('SELECT public_id, type FROM materials WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].public_id) {
            await cloudinary.uploader.destroy(rows[0].public_id, {
                resource_type: rows[0].type === 'video' ? 'video' : 'image',
            });
        }

        await db.query('DELETE FROM materials WHERE id = ?', [id]);
        res.json({ message: 'Đã xóa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa' });
    }
};

exports.updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        await db.query('UPDATE materials SET title = ? WHERE id = ?', [title, id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};

exports.searchMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const { q } = req.query;
        const query = `
            SELECT * FROM materials 
            WHERE class_id = ? AND title LIKE ? 
            ORDER BY created_at DESC
        `;
        const [results] = await db.query(query, [classId, `%${q}%`]);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tìm kiếm' });
    }
};
