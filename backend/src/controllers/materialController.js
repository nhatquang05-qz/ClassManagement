const db = require('../config/dbConfig');
const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require('streamifier');

const uploadFromBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const isImage = file.mimetype.startsWith('image/');
        const isPdf = file.mimetype === 'application/pdf';

        let resourceType = 'raw';
        if (isImage || isPdf) {
            resourceType = 'image';
        }
        if (file.mimetype.startsWith('video/')) {
            resourceType = 'video';
        }

        const originalName = file.originalname;
        const extension = originalName.split('.').pop();
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const customPublicId = `${nameWithoutExt}_${Date.now()}`;

        const uploadOptions = {
            folder: 'class-materials',
            resource_type: resourceType,
            public_id: customPublicId,
        };

        if (resourceType === 'raw') {
            uploadOptions.public_id = `${customPublicId}.${extension}`;
        }

        const cld_upload_stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(file.buffer).pipe(cld_upload_stream);
    });
};

exports.getMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const { parentId } = req.query;

        let query = 'SELECT * FROM materials WHERE class_id = ?';
        let params = [classId];

        if (parentId && parentId !== 'null' && parentId !== '') {
            query += ' AND parent_id = ?';
            params.push(parentId);
        } else {
            query += ' AND parent_id IS NULL';
        }

        query += ' ORDER BY type ASC, created_at DESC';

        const [results] = await db.query(query, params);
        res.json(results);
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy tài liệu' });
    }
};

exports.getMaterialDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query('SELECT * FROM materials WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
        }

        const currentFolder = rows[0];

        let path = [currentFolder];
        let parentId = currentFolder.parent_id;

        while (parentId) {
            const [parents] = await db.query(
                'SELECT id, title, parent_id FROM materials WHERE id = ?',
                [parentId]
            );
            if (parents.length === 0) break;

            path.unshift(parents[0]);
            parentId = parents[0].parent_id;
        }

        res.json({
            ...currentFolder,
            path: path,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const { classId } = req.params;
        const { type, title, url, parentId, description } = req.body;

        if (type === 'file' && !req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để tải lên' });
        }

        let finalUrl = url || null;
        let publicId = null;
        let mimeType = null;

        if (req.file) {
            const result = await uploadFromBuffer(req.file);
            finalUrl = result.secure_url;
            publicId = result.public_id;
            mimeType = req.file.mimetype;
        }

        const query = `
            INSERT INTO materials (class_id, parent_id, type, title, description, url, public_id, file_mime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const pId =
            parentId === 'null' || parentId === '' || parentId === undefined ? null : parentId;

        await db.query(query, [
            classId,
            pId,
            type,
            title,
            description,
            finalUrl,
            publicId,
            mimeType,
        ]);
        res.status(201).json({ message: 'Tạo thành công', url: finalUrl });
    } catch (error) {
        console.error('Create material error:', error);
        res.status(500).json({ message: 'Lỗi khi tạo tài liệu: ' + error.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT public_id, type FROM materials WHERE id = ?', [id]);

        if (rows.length > 0 && rows[0].public_id) {
            try {
                await cloudinary.uploader.destroy(rows[0].public_id);
            } catch (err) {
                console.error('Cloudinary delete error:', err);
            }
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
        const { title, description } = req.body;

        await db.query('UPDATE materials SET title = ?, description = ? WHERE id = ?', [
            title,
            description,
            id,
        ]);
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

exports.moveMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { newParentId } = req.body;

        if (parseInt(id) === parseInt(newParentId)) {
            return res.status(400).json({ message: 'Không thể di chuyển vào chính nó' });
        }

        if (newParentId && newParentId !== 'root') {
            const [target] = await db.query('SELECT type FROM materials WHERE id = ?', [
                newParentId,
            ]);
            if (target.length === 0)
                return res.status(404).json({ message: 'Thư mục đích không tồn tại' });

            if (target[0].type !== 'folder') {
                return res.status(400).json({ message: 'Chỉ có thể di chuyển vào Thư mục!' });
            }
        }

        const pId = newParentId === 'root' || !newParentId ? null : newParentId;

        await db.query('UPDATE materials SET parent_id = ? WHERE id = ?', [pId, id]);
        res.json({ message: 'Di chuyển thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi di chuyển' });
    }
};

exports.copyMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetParentId } = req.body;

        if (targetParentId && targetParentId !== 'root') {
            const [target] = await db.query('SELECT type FROM materials WHERE id = ?', [
                targetParentId,
            ]);
            if (target.length === 0 || target[0].type !== 'folder') {
                return res.status(400).json({ message: 'Chỉ có thể sao chép vào Thư mục!' });
            }
        }

        const [rows] = await db.query('SELECT * FROM materials WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy file gốc' });
        const original = rows[0];

        const newTitle = `${original.title} (Copy)`;
        const pId = targetParentId === 'root' || !targetParentId ? null : targetParentId;

        const query = `
            INSERT INTO materials (class_id, parent_id, type, title, description, url, public_id, file_mime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            original.class_id,
            pId,
            original.type,
            newTitle,
            original.description,
            original.url,
            original.public_id,
            original.file_mime,
        ]);

        res.status(201).json({ message: 'Sao chép thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi sao chép' });
    }
};
