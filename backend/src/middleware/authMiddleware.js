const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Không có token, từ chối truy cập!' });
    }

    try {
        const bearer = token.split(' ');
        const tokenValue = bearer[1];

        const decoded = jwt.verify(
            tokenValue,
            process.env.JWT_SECRET || 'bi_mat_khong_duoc_bat_mi_123'
        );
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

module.exports = verifyToken;
