const express = require('express');
const cors = require('cors');

// Import Controllers
const authController = require('./controllers/authController');
const dashboardController = require('./controllers/dashboardController');
const reportController = require('./controllers/reportController');
const userController = require('./controllers/userController'); // <-- Mới
const violationController = require('./controllers/violationController'); // <-- Mới

// Import Routes (nếu dùng router riêng)
const reportRoutes = require('./routes/reportRoutes');
const verifyToken = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// --- DANH SÁCH API ---

// 1. Auth & Dashboard
app.post('/api/auth/login', authController.login);
app.get('/api/dashboard/rankings', dashboardController.getGroupRankings);

// 2. Reports (Ghi lỗi & Xem lịch sử) - Dùng Router riêng
app.use('/api/reports', reportRoutes);

// 3. API mới thêm cho trang Sổ Theo Dõi (Quan trọng)
app.get('/api/users', userController.getUsers);
app.get('/api/violations', violationController.getAllViolations);

// Xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
