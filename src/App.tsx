import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassProvider } from './contexts/ClassContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RankingPage from './pages/RankingPage';
import ClassInfoPage from './pages/ClassInfoPage';
import MyRecordPage from './pages/MyRecordPage';
import TrackingPage from './pages/TrackingPage';
import ReportPage from './pages/ReportPage';
import StudentManagerPage from './pages/StudentManagerPage';
import MaterialsPage from './pages/MaterialsPage';
import ExamResultPage from './pages/ExamResultPage';
import TeacherExamPage from './pages/TeacherExamPage';
import StudentExamPage from './pages/StudentExamPage';
import ExamTakingPage from './pages/ExamTakingPage';
import DutyTrackingPage from './pages/DutyTrackingPage';
import SupportPage from './pages/SupportPage';
import AdminSupportPage from './pages/AdminSupportPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <ClassProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />

                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <MainLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<DashboardPage />} />
                            <Route path="ranking" element={<RankingPage />} />
                            <Route path="info" element={<ClassInfoPage />} />
                            <Route path="my-record" element={<MyRecordPage />} />
                            <Route path="tracking" element={<TrackingPage />} />
                            <Route path="duty" element={<DutyTrackingPage />} />
                            <Route path="report" element={<ReportPage />} />
                            <Route path="students" element={<StudentManagerPage />} />
                            <Route path="materials" element={<MaterialsPage />} />
                            <Route path="materials/:folderId" element={<MaterialsPage />} />
                            <Route path="exam-review/:submissionId" element={<ExamResultPage />} />
                            <Route path="create-exam" element={<TeacherExamPage />} />
                            <Route path="student-exams" element={<StudentExamPage />} />
                            <Route path="take-exam/:id" element={<ExamTakingPage />} />
                            <Route path="support" element={<SupportPage />} />
                            <Route path="admin/support" element={<AdminSupportPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ClassProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
