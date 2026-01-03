import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassProvider } from './contexts/ClassContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RankingPage from './pages/RankingPage';
import TrackingPage from './pages/TrackingPage';
import MyRecordPage from './pages/MyRecordPage';
import StudentManagerPage from './pages/StudentManagerPage';
import ReportPage from './pages/ReportPage';
import MainLayout from './components/layout/MainLayout';
import ClassInfoPage from './pages/ClassInfoPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div>Loading...</div>;
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
                            element={
                                <ProtectedRoute>
                                    <MainLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/ranking" element={<RankingPage />} />
                            <Route path="/tracking" element={<TrackingPage />} />
                            <Route path="/my-record" element={<MyRecordPage />} />
                            <Route path="/students" element={<StudentManagerPage />} />
                            <Route path="/report" element={<ReportPage />} />
                            <Route path="/info" element={<ClassInfoPage />} />
                        </Route>
                    </Routes>
                </ClassProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
