import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassProvider } from './contexts/ClassContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RankingPage from './pages/RankingPage';
import TrackingPage from './pages/TrackingPage';
import MyRecordPage from './pages/MyRecordPage';
import ClassSelectionPage from './pages/ClassSelectionPage';

import StudentManagerPage from './pages/StudentManagerPage';
import ReportPage from './pages/ReportPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '50px',
                    color: '#666',
                }}
            >
                Đang tải dữ liệu...
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
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
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/ranking"
                            element={
                                <ProtectedRoute>
                                    <RankingPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/tracking"
                            element={
                                <ProtectedRoute>
                                    <TrackingPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-record"
                            element={
                                <ProtectedRoute>
                                    <MyRecordPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/classes"
                            element={
                                <ProtectedRoute>
                                    <ClassSelectionPage />
                                </ProtectedRoute>
                            }
                        />

                        {}

                        <Route
                            path="/students"
                            element={
                                <ProtectedRoute>
                                    <StudentManagerPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/report"
                            element={
                                <ProtectedRoute>
                                    <ReportPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </ClassProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
