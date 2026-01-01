const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');


const getUsers = async (req, res) => {
  try {
    const { class_id, group_number } = req.query;

    let query = `
      SELECT id, full_name, username, group_number, role_id, is_locked, class_id
      FROM users 
      WHERE role_id != 1 -- Không lấy admin
    `;
    const params = [];

    if (class_id) {
        query += ` AND class_id = ?`;
        params.push(class_id);
    }

    if (group_number) {
      query += ` AND group_number = ?`;
      params.push(group_number);
    }

    query += ` ORDER BY group_number ASC, full_name ASC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy danh sách' });
  }
};


const importStudents = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { class_id } = req.body;
        
        if (!req.file || !class_id) {
            return res.status(400).json({ message: 'Thiếu file hoặc ID lớp' });
        }

        
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        
        
        await connection.beginTransaction();
        const defaultHash = await bcrypt.hash('123456', 10); 

        
        const STUDENT_ROLE_ID = 3; 

        for (let row of data) {
            const fullName = row['HoTen'] || row['Họ và tên'];
            const groupNum = row['To'] || row['Tổ'] || 0;
            
            
            const username = `hs${Date.now()}${Math.floor(Math.random()*100)}`;

            if (fullName) {
                await connection.query(
                    `INSERT INTO users (username, password, full_name, role_id, group_number, class_id, is_locked) 
                     VALUES (?, ?, ?, ?, ?, ?, 0)`,
                    [username, defaultHash, fullName, STUDENT_ROLE_ID, groupNum, class_id]
                );
            }
        }

        await connection.commit();
        res.json({ message: `Đã thêm ${data.length} học sinh vào lớp.` });

    } catch (error) {
        await connection.rollback();
        console.error("Import error:", error);
        res.status(500).json({ message: 'Lỗi xử lý file excel' });
    } finally {
        connection.release();
    }
};


const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_locked, password, role_id, full_name, group_number } = req.body;
        
        let query = "UPDATE users SET ";
        const updates = [];
        const params = [];

        if (is_locked !== undefined) { updates.push("is_locked = ?"); params.push(is_locked); }
        if (role_id) { updates.push("role_id = ?"); params.push(role_id); }
        if (full_name) { updates.push("full_name = ?"); params.push(full_name); }
        if (group_number) { updates.push("group_number = ?"); params.push(group_number); }
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            updates.push("password = ?");
            params.push(hash);
        }

        if (updates.length === 0) return res.json({ message: "Không có gì thay đổi" });

        query += updates.join(", ") + " WHERE id = ?";
        params.push(id);

        await db.query(query, params);
        res.json({ message: "Cập nhật thành công" });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật user' });
    }
};

module.exports = { getUsers, importStudents, updateUser };