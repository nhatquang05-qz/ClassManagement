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
                            <Route path="report" element={<ReportPage />} />
                            <Route path="students" element={<StudentManagerPage />} />
                            <Route path="materials" element={<MaterialsPage />} />
                            <Route path="materials/:folderId" element={<MaterialsPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ClassProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
