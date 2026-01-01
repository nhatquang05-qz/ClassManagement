const express = require('express');
const cors = require('cors');
// Import Controllers
const authController = require('./controllers/authController');
const dashboardController = require('./controllers/dashboardController');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Auth Routes (Viết trực tiếp hoặc tách file đều được, ở đây viết gọn)
app.post('/api/auth/login', authController.login);

// Dashboard Routes
app.get('/api/dashboard/rankings', dashboardController.getGroupRankings);

// Report Routes
app.use('/api/reports', reportRoutes);

module.exports = app;