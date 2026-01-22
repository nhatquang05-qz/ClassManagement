const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const dashboardController = require('./controllers/dashboardController');
const violationController = require('./controllers/violationController');
const classRoutes = require('./routes/classRoutes');
const userRoutes = require('./routes/userRoutes');
const infoRoutes = require('./routes/infoRoutes');
const reportRoutes = require('./routes/reportRoutes');
const materialRoutes = require('./routes/materialRoutes');
const examRoutes = require('./routes/examRoutes');
const verifyToken = require('./middleware/authMiddleware');
const dutyRoutes = require('./routes/dutyRoutes');
const supportRoutes = require('./routes/supportRoutes');
const specializedRoutes = require('./routes/specializedRoutes');
const aiReportRoutes = require('./routes/aiReportRoutes');
const app = express();

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.get('/ping', (req, res) => {
    res.status(200).send('Pong!');
});

app.use(express.json());

app.use('/api/classes', classRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/change-password', verifyToken, authController.changePassword);
app.get('/api/auth/me', verifyToken, authController.getMe);
app.get('/api/dashboard/rankings', dashboardController.getGroupRankings);
app.use('/api/reports', reportRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/duty', dutyRoutes);
app.use('/api/support', supportRoutes);
app.get('/api/violations', violationController.getAllViolations);
app.use('/api/specialized', specializedRoutes);
app.use('/api/ai-report', aiReportRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
app.use('/api/exams', examRoutes);
module.exports = app;
