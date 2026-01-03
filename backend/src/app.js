const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const dashboardController = require('./controllers/dashboardController');
const reportController = require('./controllers/reportController');
const userController = require('./controllers/userController');
const violationController = require('./controllers/violationController');
const classRoutes = require('./routes/classRoutes');
const userRoutes = require('./routes/userRoutes');

const reportRoutes = require('./routes/reportRoutes');
const verifyToken = require('./middleware/authMiddleware');

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

app.post('/api/auth/login', authController.login);
app.post('/api/auth/change-password', verifyToken, authController.changePassword);
app.get('/api/auth/me', verifyToken, authController.getMe);

app.get('/api/dashboard/rankings', dashboardController.getGroupRankings);

app.use('/api/reports', reportRoutes);

app.get('/api/violations', violationController.getAllViolations);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
