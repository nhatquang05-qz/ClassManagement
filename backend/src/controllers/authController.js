const db = require('../config/dbConfig');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu' });
  }

  try {
    const [users] = await db.query(
      `SELECT u.*, r.name as role_name, r.display_name as role_display 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ?`, 
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }

    const user = users[0];

    // Lưu ý: Đang so sánh plain text. Nếu database đã hash pass thì dùng bcrypt.compare
    if (password !== user.password) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }

    // Tạo Token (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role_name, group: user.group_number },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role_name,
        role_display: user.role_display,
        group_number: user.group_number
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { login };